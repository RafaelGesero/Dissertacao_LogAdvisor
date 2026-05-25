start:
	sudo docker-compose up -d
	cd backend && ./mvnw spring-boot:run &
	cd frontend && npm run dev

stop:
	sudo systemctl restart docker
	sudo fuser -k 8080/tcp || true
	sudo fuser -k 3000/tcp || true
	pkill -f "mvnw" || true
	pkill -f "next" || true