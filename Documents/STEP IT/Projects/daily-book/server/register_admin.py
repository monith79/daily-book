import requests
import json

url = "http://localhost:5000/api/register"
headers = {"Content-Type": "application/json"}
data = {
    "username": "user",
    "password": "user"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    response_json = response.json()
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response_json}")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to the backend server.")
    print("Please ensure the Flask backend is running on http://localhost:5000")
except json.JSONDecodeError:
    print(f"JSONDecodeError: Could not decode JSON from response.")
    print(f"Status Code: {response.status_code if 'response' in locals() else 'N/A'}")
    print(f"Response Text: {response.text if 'response' in locals() else 'N/A'}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    print(f"Status Code: {response.status_code if 'response' in locals() else 'N/A'}")
    print(f"Response Text: {response.text if 'response' in locals() else 'N/A'}")
