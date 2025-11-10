"""
Blockchain Implementation for Evidence Protection System
Custom blockchain without third-party SDKs
"""
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional


class Block:
    """Individual block in the blockchain"""
    
    def __init__(self, index: int, timestamp: str, data: Dict[str, Any], prev_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.prev_hash = prev_hash
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of the block"""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "prev_hash": self.prev_hash
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert block to dictionary"""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "prev_hash": self.prev_hash,
            "hash": self.hash
        }


class Blockchain:
    """Blockchain for evidence tracking"""
    
    def __init__(self):
        self.chain: List[Block] = []
        self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block in the chain"""
        genesis_block = Block(
            index=0,
            timestamp=datetime.now().isoformat(),
            data={
                "action": "genesis",
                "user_role": "system",
                "user_id": 0,
                "details": {"message": "Evidence Protection System Initialized"}
            },
            prev_hash="0"
        )
        self.chain.append(genesis_block)
    
    def get_latest_block(self) -> Block:
        """Get the most recent block"""
        return self.chain[-1]
    
    def add_block(self, data: Dict[str, Any]) -> Block:
        """Add a new block to the chain"""
        latest_block = self.get_latest_block()
        new_block = Block(
            index=latest_block.index + 1,
            timestamp=datetime.now().isoformat(),
            data=data,
            prev_hash=latest_block.hash
        )
        self.chain.append(new_block)
        return new_block
    
    def is_chain_valid(self) -> Dict[str, Any]:
        """
        Validate the entire blockchain
        Returns: {"valid": bool, "broken_at": int or None, "message": str}
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if current block's hash is correct
            if current_block.hash != current_block.calculate_hash():
                return {
                    "valid": False,
                    "broken_at": i,
                    "message": f"Block {i} has been tampered with (hash mismatch)"
                }
            
            # Check if previous hash matches
            if current_block.prev_hash != previous_block.hash:
                return {
                    "valid": False,
                    "broken_at": i,
                    "message": f"Block {i} has broken chain link (prev_hash mismatch)"
                }
        
        return {
            "valid": True,
            "broken_at": None,
            "message": "Blockchain is valid and intact"
        }
    
    def get_chain(self) -> List[Dict[str, Any]]:
        """Get the entire blockchain as list of dictionaries"""
        return [block.to_dict() for block in self.chain]
    
    def get_blocks_by_evidence_id(self, evidence_id: int) -> List[Dict[str, Any]]:
        """Get all blocks related to a specific evidence ID"""
        related_blocks = []
        for block in self.chain:
            if block.data.get("details", {}).get("evidence_id") == evidence_id:
                related_blocks.append(block.to_dict())
        return related_blocks
    
    def get_recent_blocks(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get the most recent blocks"""
        return [block.to_dict() for block in self.chain[-count:]]
    
    def to_json(self) -> str:
        """Export blockchain to JSON string"""
        return json.dumps(self.get_chain(), indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Blockchain':
        """Import blockchain from JSON string"""
        blockchain = cls()
        blockchain.chain = []  # Clear genesis block
        
        blocks_data = json.loads(json_str)
        for block_data in blocks_data:
            block = Block(
                index=block_data["index"],
                timestamp=block_data["timestamp"],
                data=block_data["data"],
                prev_hash=block_data["prev_hash"]
            )
            # CRITICAL: Preserve the stored hash instead of recalculating
            # This allows validation to detect if content was tampered
            block.hash = block_data["hash"]
            blockchain.chain.append(block)
        
        return blockchain

