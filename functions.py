def commands(text):
    effects = {}
    
    if '/persist' in text:
        text = text.replace('/persist', '')
        effects['persist'] = True
        
    if '/golden' in text:
        text = text.replace('/golden', '')
        effects['golden'] = True
        
    return text, effects
