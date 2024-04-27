from pymongo import MongoClient
import os

# Connect to MongoDB
mongo_client = MongoClient(os.getenv('mongodb'))
db = mongo_client['chat']
collection = os.getenv('collection')
messages_collection = db[collection]

user_log = db['log']