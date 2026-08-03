import sys
import re

if __name__ == "__main__":
    msg = sys.stdin.read()
    # Remove lines that contain 'Co-Authored-By: Claude'
    cleaned_lines = []
    for line in msg.split('\n'):
        if not re.search(r'Co-Authored-By: Claude', line, re.IGNORECASE):
            cleaned_lines.append(line)
    
    # Print the cleaned message
    sys.stdout.write('\n'.join(cleaned_lines))
