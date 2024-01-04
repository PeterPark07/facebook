from pymongo import MongoClient
import os

# Connect to MongoDB
mongo_client = MongoClient(os.getenv('mongodb'))
db = mongo_client['chat']
messages_collection = db['messages']
