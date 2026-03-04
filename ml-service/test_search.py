# from search_engine import search

# query = input("Enter your legal text: ")

# results = search(query)

# print("\nTop 3 Matching Chunks:\n")

# for r in results:
#     print("-" * 50)
#     print(r)

import sys
from search_engine import search
import json

if len(sys.argv) < 2:
    print(json.dumps({"error": "No query provided"}))
    sys.exit()

query = sys.argv[1]

results = search(query)

print(json.dumps({
    "results": results
}))