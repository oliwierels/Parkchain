.PHONY: help install setup dev start stop clean logs test migrate seed docker-up docker-down

help:
	@echo "🚗 Parkchain - Dostępne Komendy:"
	@echo ""
	@echo "  make install      - Instaluj zależności"
	@echo "  make setup        - Pełna konfiguracja"
	@echo "  make dev          - Start serwery deweloperskie"
	@echo "  make docker-up    - Start Docker (zalecane)"
	@echo "  make docker-down  - Stop Docker"
	@echo "  make migrate      - Uruchom migracje bazy"
	@echo "  make seed         - Zasiej dane testowe"
	@echo "  make test         - Uruchom testy"
	@echo "  make clean        - Wyczyść pliki"
	@echo "  make logs         - Zobacz logi"
	@echo ""

install:
	@echo "📦 Instalowanie zależności..."
	cd backend && npm install
	cd frontend && npm install
	@echo "✅ Zależności zainstalowane"

setup: install
	@echo "🔧 Konfiguracja Parkchain..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "⚠️  Utworzono plik .env. Skonfiguruj swoje zmienne!"; \
	fi
	@echo "✅ Konfiguracja zakończona!"

dev:
	@echo "🚀 Uruchamianie serwerów deweloperskich..."
	@trap 'kill 0' EXIT; \
	(cd backend && npm run dev) & \
	(cd frontend && npm run dev) & \
	wait

start:
	@echo "🚀 Uruchamianie serwerów produkcyjnych..."
	cd backend && npm start &
	cd frontend && npm run preview &

stop:
	@echo "🛑 Zatrzymywanie serwerów..."
	@pkill -f "node.*server.js" || true
	@pkill -f "vite" || true
	@echo "✅ Serwery zatrzymane"

docker-up:
	@echo "🐳 Uruchamianie kontenerów Docker..."
	docker-compose up -d
	@echo "✅ Kontenery uruchomione"
	@echo "📍 Frontend: http://localhost:5173"
	@echo "📍 Backend API: http://localhost:3000"
	@echo "📍 pgAdmin: http://localhost:5050"

docker-down:
	@echo "🐳 Zatrzymywanie kontenerów Docker..."
	docker-compose down
	@echo "✅ Kontenery zatrzymane"

docker-logs:
	docker-compose logs -f

docker-restart:
	@echo "🔄 Restart kontenerów..."
	docker-compose restart
	@echo "✅ Kontenery zrestartowane"

migrate:
	@echo "🗄️  Uruchamianie migracji bazy..."
	cd backend && npm run migrate
	@echo "✅ Migracje ukończone"

seed:
	@echo "🌱 Zasianie bazy danych..."
	cd backend && npm run seed
	@echo "✅ Baza zasiana"

test:
	@echo "🧪 Uruchamianie testów..."
	cd backend && npm test
	@echo "✅ Testy zakończone"

clean:
	@echo "🧹 Czyszczenie..."
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/dist
	rm -rf frontend/dist
	@echo "✅ Wyczyszczono"

logs:
	@echo "📋 Logi..."
	tail -f backend/logs/*.log

health:
	@echo "🏥 Sprawdzanie zdrowia usług..."
	@curl -s http://localhost:3000/health || echo "❌ Backend nie działa"

status:
	@echo "📊 Status usług:"
	@docker-compose ps

backup:
	@echo "💾 Tworzenie kopii zapasowej..."
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U parkchain_user parkchain_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Kopia utworzona w backups/"