dev:
	docker-compose up --build

migrate:
	echo "Run backend/migrations/001_complete_schema.sql in Supabase"

lint-be:
	cd backend && ruff check .

lint-fe:
	cd frontend && npm run lint

build:
	docker-compose build
