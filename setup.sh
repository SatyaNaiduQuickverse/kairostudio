#!/bin/bash

echo "🚀 Setting up Kairos Studio project structure..."

# Create main directories
mkdir -p frontend/src/components
mkdir -p frontend/public
mkdir -p backend

# Create .gitignore for the root
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
frontend/build/
backend/dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Docker
.dockerignore
EOF

# Create backend .env file
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=5000
EOF

# Create backend .gitignore
cat > backend/.gitignore << 'EOF'
node_modules/
.env
*.log
dist/
EOF

# Create frontend .gitignore
cat > frontend/.gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

echo "✅ Project structure created!"
echo ""
echo "Next steps:"
echo "1. Run this script: chmod +x setup.sh && ./setup.sh"
echo "2. Install backend dependencies: cd backend && npm install"
echo "3. Install frontend dependencies: cd frontend && npm install"
echo "4. Start development: docker-compose up --build"
echo ""
echo "📁 Directory structure:"
echo "├── docker-compose.yml"
echo "├── nginx.conf"
echo "├── backend/"
echo "│   ├── package.json"
echo "│   ├── server.js"
echo "│   └── Dockerfile"
echo "└── frontend/"
echo "    ├── package.json"
echo "    ├── Dockerfile"
echo "    ├── public/"
echo "    │   └── index.html"
echo "    └── src/"
echo "        ├── App.jsx"
echo "        ├── App.css"
echo "        ├── index.js"
echo "        ├── index.css"
echo "        └── components/"
echo "            ├── Header.jsx & Header.css"
echo "            ├── Hero.jsx & Hero.css"
echo "            ├── Services.jsx & Services.css"
echo "            ├── Portfolio.jsx & Portfolio.css"
echo "            ├── About.jsx & About.css"
echo "            ├── Contact.jsx & Contact.css"
echo "            └── Footer.jsx & Footer.css"
