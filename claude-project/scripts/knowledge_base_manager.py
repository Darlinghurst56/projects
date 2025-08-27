#!/usr/bin/env python3
"""
Knowledge Base Manager for Paperless-ngx
Manages auto-tagging rules and knowledge base operations
"""

import os
import json
import logging
import requests
from typing import List, Dict, Any
import chromadb
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KnowledgeBaseManager:
    def __init__(self):
        self.paperless_url = os.getenv('PAPERLESS_API_URL', 'http://paperless-webserver:8000')
        self.paperless_token = os.getenv('PAPERLESS_API_TOKEN')
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.HttpClient(host='chromadb', port=8000)
        self.collection = self.chroma_client.get_or_create_collection(
            name="paperless_documents",
            metadata={"description": "Paperless-ngx document knowledge base"}
        )
        
        # Auto-tagging rules
        self.tagging_rules = self._load_tagging_rules()
        
    def _load_tagging_rules(self) -> Dict[str, Any]:
        """Load auto-tagging rules"""
        default_rules = {
            "financial": {
                "keywords": ["invoice", "receipt", "payment", "tax", "expense", "billing"],
                "tags": ["finance", "accounting"],
                "correspondent_patterns": ["bank", "visa", "mastercard", "paypal"]
            },
            "legal": {
                "keywords": ["contract", "agreement", "legal", "terms", "conditions"],
                "tags": ["legal", "contracts"],
                "correspondent_patterns": ["law", "attorney", "court"]
            },
            "medical": {
                "keywords": ["medical", "doctor", "hospital", "prescription", "insurance"],
                "tags": ["medical", "health"],
                "correspondent_patterns": ["clinic", "hospital", "dr.", "medical"]
            },
            "personal": {
                "keywords": ["personal", "family", "home", "utilities"],
                "tags": ["personal", "household"],
                "correspondent_patterns": ["utility", "electric", "water", "gas"]
            },
            "work": {
                "keywords": ["work", "office", "meeting", "project", "salary"],
                "tags": ["work", "professional"],
                "correspondent_patterns": ["hr", "payroll", "company"]
            }
        }
        
        # Try to load custom rules from file
        rules_file = "/data/tagging_rules.json"
        if os.path.exists(rules_file):
            try:
                with open(rules_file, 'r') as f:
                    custom_rules = json.load(f)
                default_rules.update(custom_rules)
                logger.info("Loaded custom tagging rules")
            except Exception as e:
                logger.error(f"Error loading custom rules: {e}")
        
        return default_rules

    def get_paperless_headers(self) -> Dict[str, str]:
        """Get headers for Paperless API requests"""
        headers = {'Content-Type': 'application/json'}
        if self.paperless_token:
            headers['Authorization'] = f'Token {self.paperless_token}'
        return headers

    def auto_tag_document(self, doc_id: int, content: str, title: str, correspondent: str = "") -> List[str]:
        """Apply auto-tagging rules to a document"""
        applied_tags = []
        content_lower = content.lower()
        title_lower = title.lower()
        correspondent_lower = correspondent.lower()
        
        for category, rules in self.tagging_rules.items():
            # Check keywords in content and title
            keyword_matches = any(
                keyword in content_lower or keyword in title_lower
                for keyword in rules.get("keywords", [])
            )
            
            # Check correspondent patterns
            correspondent_matches = any(
                pattern in correspondent_lower
                for pattern in rules.get("correspondent_patterns", [])
            )
            
            if keyword_matches or correspondent_matches:
                applied_tags.extend(rules.get("tags", []))
                logger.info(f"Applied {category} tags to document {doc_id}")
        
        # Remove duplicates
        applied_tags = list(set(applied_tags))
        
        # Apply tags to document
        if applied_tags:
            self._apply_tags_to_document(doc_id, applied_tags)
        
        return applied_tags

    def _apply_tags_to_document(self, doc_id: int, tag_names: List[str]):
        """Apply tags to a Paperless document"""
        try:
            # Get existing document
            response = requests.get(
                f"{self.paperless_url}/api/documents/{doc_id}/",
                headers=self.get_paperless_headers()
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get document {doc_id}")
                return
            
            doc_data = response.json()
            existing_tag_ids = doc_data.get('tags', [])
            
            # Create/get tag IDs
            new_tag_ids = []
            for tag_name in tag_names:
                tag_id = self._get_or_create_tag(tag_name)
                if tag_id and tag_id not in existing_tag_ids:
                    new_tag_ids.append(tag_id)
            
            # Update document with new tags
            if new_tag_ids:
                all_tag_ids = existing_tag_ids + new_tag_ids
                update_data = {'tags': all_tag_ids}
                
                response = requests.patch(
                    f"{self.paperless_url}/api/documents/{doc_id}/",
                    headers=self.get_paperless_headers(),
                    json=update_data
                )
                
                if response.status_code == 200:
                    logger.info(f"Applied tags {tag_names} to document {doc_id}")
                else:
                    logger.error(f"Failed to update document {doc_id}: {response.text}")
        
        except Exception as e:
            logger.error(f"Error applying tags to document {doc_id}: {e}")

    def _get_or_create_tag(self, tag_name: str) -> int:
        """Get or create a tag in Paperless"""
        try:
            # Check if tag exists
            response = requests.get(
                f"{self.paperless_url}/api/tags/",
                headers=self.get_paperless_headers(),
                params={'name': tag_name}
            )
            
            if response.status_code == 200:
                existing_tags = response.json()['results']
                if existing_tags:
                    return existing_tags[0]['id']
            
            # Create new tag
            tag_data = {
                'name': tag_name,
                'color': self._get_tag_color(tag_name),
                'is_inbox_tag': False
            }
            
            response = requests.post(
                f"{self.paperless_url}/api/tags/",
                headers=self.get_paperless_headers(),
                json=tag_data
            )
            
            if response.status_code == 201:
                return response.json()['id']
        
        except Exception as e:
            logger.error(f"Error creating tag {tag_name}: {e}")
        
        return None

    def _get_tag_color(self, tag_name: str) -> str:
        """Get color for tag based on category"""
        color_map = {
            'finance': '#28a745',      # Green
            'legal': '#dc3545',        # Red
            'medical': '#007bff',      # Blue
            'personal': '#ffc107',     # Yellow
            'work': '#6f42c1',         # Purple
            'accounting': '#28a745',   # Green
            'contracts': '#dc3545',    # Red
            'health': '#007bff',       # Blue
            'household': '#ffc107',    # Yellow
            'professional': '#6f42c1'  # Purple
        }
        return color_map.get(tag_name.lower(), '#6c757d')  # Default gray

    def search_knowledge_base(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search the knowledge base for similar documents"""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            search_results = []
            for i, doc_id in enumerate(results['ids'][0]):
                result = {
                    'document_id': doc_id,
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i] if 'distances' in results else 0,
                    'content_snippet': results['documents'][0][i][:200] + '...'
                }
                search_results.append(result)
            
            return search_results
        
        except Exception as e:
            logger.error(f"Error searching knowledge base: {e}")
            return []

    def generate_document_insights(self, doc_id: int) -> Dict[str, Any]:
        """Generate insights for a document using the knowledge base"""
        try:
            # Get document from Paperless
            response = requests.get(
                f"{self.paperless_url}/api/documents/{doc_id}/",
                headers=self.get_paperless_headers()
            )
            
            if response.status_code != 200:
                return {"error": "Document not found"}
            
            doc_data = response.json()
            title = doc_data.get('title', '')
            content = doc_data.get('content', '')
            
            # Find similar documents
            similar_docs = self.search_knowledge_base(f"{title} {content[:500]}")
            
            # Generate insights
            insights = {
                'document_id': doc_id,
                'title': title,
                'similar_documents': similar_docs,
                'suggested_actions': self._suggest_actions(doc_data, similar_docs),
                'knowledge_connections': self._find_knowledge_connections(doc_data),
                'generated_at': datetime.now().isoformat()
            }
            
            return insights
        
        except Exception as e:
            logger.error(f"Error generating insights for document {doc_id}: {e}")
            return {"error": str(e)}

    def _suggest_actions(self, doc_data: Dict[str, Any], similar_docs: List[Dict[str, Any]]) -> List[str]:
        """Suggest actions based on document type and similar documents"""
        suggestions = []
        
        # Based on document type
        title = doc_data.get('title', '').lower()
        if 'invoice' in title:
            suggestions.append("Consider adding payment due date")
            suggestions.append("Link to corresponding purchase order")
        elif 'contract' in title:
            suggestions.append("Set reminder for renewal date")
            suggestions.append("Extract key terms and conditions")
        elif 'receipt' in title:
            suggestions.append("Categorize for expense reporting")
            suggestions.append("Check if reimbursable")
        
        # Based on similar documents
        if len(similar_docs) > 2:
            suggestions.append("Review similar documents for consistency")
            suggestions.append("Consider creating a document series or folder")
        
        return suggestions

    def _find_knowledge_connections(self, doc_data: Dict[str, Any]) -> List[str]:
        """Find connections to other documents in the knowledge base"""
        connections = []
        
        correspondent = doc_data.get('correspondent', {}).get('name', '') if doc_data.get('correspondent') else ''
        tags = [tag.get('name', '') for tag in doc_data.get('tags', [])]
        
        if correspondent:
            connections.append(f"Part of correspondence with {correspondent}")
        
        if tags:
            connections.append(f"Related to topics: {', '.join(tags)}")
        
        return connections

    def bulk_process_documents(self, limit: int = 100):
        """Bulk process documents for auto-tagging and knowledge base building"""
        try:
            # Get unprocessed documents
            response = requests.get(
                f"{self.paperless_url}/api/documents/",
                headers=self.get_paperless_headers(),
                params={'page_size': limit, 'ordering': '-created'}
            )
            
            if response.status_code != 200:
                logger.error("Failed to get documents from Paperless")
                return
            
            documents = response.json()['results']
            logger.info(f"Processing {len(documents)} documents for auto-tagging")
            
            for doc in documents:
                doc_id = doc['id']
                title = doc.get('title', '')
                content = doc.get('content', '')
                correspondent = doc.get('correspondent', {}).get('name', '') if doc.get('correspondent') else ''
                
                # Apply auto-tagging
                applied_tags = self.auto_tag_document(doc_id, content, title, correspondent)
                
                # Add to knowledge base if not already there
                try:
                    existing = self.collection.get(ids=[f"doc_{doc_id}"])
                    if not existing['ids']:
                        self.collection.add(
                            documents=[content[:4000]],  # Limit content size
                            metadatas=[{
                                'paperless_id': doc_id,
                                'title': title,
                                'correspondent': correspondent,
                                'tags': ', '.join(applied_tags),
                                'created': doc.get('created', '')
                            }],
                            ids=[f"doc_{doc_id}"]
                        )
                        logger.info(f"Added document {doc_id} to knowledge base")
                except Exception as e:
                    logger.error(f"Error adding document {doc_id} to knowledge base: {e}")
        
        except Exception as e:
            logger.error(f"Error in bulk processing: {e}")

if __name__ == "__main__":
    kb_manager = KnowledgeBaseManager()
    kb_manager.bulk_process_documents()