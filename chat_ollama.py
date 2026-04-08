import ollama

# take user input
place = input("Enter destination: ")

# send prompt to llama3
response = ollama.chat(
    model="llama3",
    messages=[
        {"role": "user", "content": f"Give 3 tourist places in {place}"}
    ]
)

# print response
print(response["message"]["content"])