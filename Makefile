start:
	docker-compose up -d
	cd backend && ./mvnw spring-boot:run &
	cd frontend && npm run dev

stop:
	docker-compose down