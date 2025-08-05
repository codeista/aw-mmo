#!/bin/bash

# Create game plan for Insect Colony Wars
cat > game-plan.json << 'EOF'
{
  "name": "Insect Colony Wars",
  "description": "Real-time strategy MMO where players control ant colonies, gathering resources and waging underground wars",
  "type": "realtime",
  "features": [
    "authentication",
    "movement",
    "chat",
    "leaderboards",
    "matchmaking"
  ]
}
EOF

echo "Game plan created for Insect Colony Wars"

# Now run the game planning agent with option 2
echo "2" | ./game-planning-agent.js

echo "Project structure generated!"