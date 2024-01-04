from database import messages_collection

def commands(text):
    effects = {}
    
    if '/persist' in text:
        text = text.replace('/persist', '')
        effects['persist'] = True
        
    if '/golden' in text:
        text = text.replace('/golden', '')
        effects['golden'] = True

    if '/animate' in text:
        text = text.replace('/animate', '')
        effects['animate'] = True

    if text.startswith('/delete') and len(text.split()) < 3:
        parts = text.split()
        
        if len(parts) == 1:
            num = 5
        elif not parts[1].isdigit():
            return text, effects
        else:
            num = int(parts[1])
        
        messages_collection.delete_many({'persist': {'$exists': False}}, sort=[("_id", -1)], limit=num)
    
    return text, effects
