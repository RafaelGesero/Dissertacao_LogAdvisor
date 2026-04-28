start:
	sudo docker-compose up -d
	cd backend && ./mvnw spring-boot:run &
	cd frontend && npm run dev

stop:
	sudo docker-compose down
	pkill -f "spring-boot:run" || true
	pkill -f "next" || true