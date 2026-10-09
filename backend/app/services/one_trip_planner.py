def generate_one_trip_plan(actions: list[dict]) -> dict:
    if not actions:
        return {}
        
    destinations = {}
    total_documents = set()
    
    for action in actions:
        dest = action.get("destination", "UNKNOWN")
        if dest not in destinations:
            destinations[dest] = {
                "destination_label": action.get("destination_label", dest),
                "actions": [],
                "what_to_carry": set(),
                "instructions": [],
                "expected_outputs": []
            }
            
        destinations[dest]["actions"].append(action.get("title", "Resolve issue"))
        
        for doc in action.get("what_to_carry", []):
            destinations[dest]["what_to_carry"].add(doc)
            total_documents.add(doc)
            
        destinations[dest]["instructions"].extend(action.get("instructions", []))
        
        if action.get("expected_output"):
            destinations[dest]["expected_outputs"].append(action.get("expected_output"))

    # Convert sets to lists
    trip_stops = []
    for dest_key, dest_data in destinations.items():
        trip_stops.append({
            "destination": dest_key,
            "destination_label": dest_data["destination_label"],
            "tasks": dest_data["actions"],
            "what_to_carry": list(dest_data["what_to_carry"]),
            "instructions": dest_data["instructions"],
            "expected_outputs": dest_data["expected_outputs"]
        })

    return {
        "title": "Consolidated One-Trip Resolution Plan",
        "description": "Combine your tasks to save time and visits.",
        "total_documents_needed": list(total_documents),
        "stops": trip_stops
    }
