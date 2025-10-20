#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

CHECK="✅"
CROSS="❌"
WARN="⚠️ "
INFO="ℹ️ "
ROCKET="🚀"
WRENCH="🔧"
PACKAGE="📦"
DATABASE="🗄️ "
MAP="🗺️ "

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARN}$1${NC}"
}

print_info() {
    echo -e "${PURPLE}${INFO}$1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_prerequisites() {
    print_header "Sprawdzanie wymagań"
    
    local all_ok=true
    
    if command_exists node; then
        NODE_VERSION=$(node -v)
        print_success "Node.js zainstalowany: $NODE_VERSION"
        
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_warning "Node.js powinien być w wersji 18 lub wyższej"
            all_ok=false
        fi
    else
        print_error "Node.js nie znaleziony. Zainstaluj Node.js 18+"
        all_ok=false
    fi
    
    if command_exists npm; then
        NPM_VERSION=$(npm -v)
        print_success "npm zainstalowany: $NPM_VERSION"
    else
        print_error "npm nie znaleziony"
        all_ok=false
    fi
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker zainstalowany: $DOCKER_VERSION"
    else
        print_warning "Docker nie znaleziony (opcjonalny ale zalecany)"
    fi
    
    if command_exists git; then
        print_success "Git zainstalowany"
    else
        print_warning "Git nie znaleziony (zalecany)"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Brakuje wymaganych narzędzi."
        exit 1
    fi
    
    print_success "Wszystkie wymagania spełnione!"
}

setup_env() {
    print_header "Konfiguracja środowiska"
    
    if [ -f .env ]; then
        print_warning "Plik .env już istnieje"
        read -p "Czy nadpisać? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Zachowano istniejący plik .env"
            return
        fi
    fi
    
    cp .env.example .env
    print_success "Utworzono plik .env"
    
    echo ""
    print_info "Skonfiguruj następujące zmienne w .env:"
    echo "  1. Token Mapbox (WYMAGANY!)"
    echo "  2. Hasło do bazy danych"
    echo "  3. JWT secret"
    echo ""
}

install_dependencies() {
    print_header "${PACKAGE} Instalacja zależności"
    
    print_info "Instalacja zależności backend..."
    cd backend
    npm install
    cd ..
    print_success "Zależności backend zainstalowane"
    
    print_info "Instalacja zależności frontend..."
    cd frontend
    npm install
    cd ..
    print_success "Zależności frontend zainstalowane"
}

setup_database() {
    print_header "${DATABASE}Konfiguracja bazy danych"
    
    echo "Wybierz metodę:"
    echo "  1. Docker (zalecane)"
    echo "  2. Lokalna PostgreSQL"
    echo "  3. Pomiń"
    echo ""
    read -p "Wybór (1-3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            print_info "Uruchamianie PostgreSQL z Docker..."
            docker-compose up -d postgres redis
            sleep 5
            print_success "Kontenery bazy uruchomione"
            
            print_info "Uruchamianie migracji..."
            cd backend
            npm run migrate
            cd ..
            print_success "Migracje ukończone"
            
            print_info "Zasianie bazy..."
            cd backend
            npm run seed
            cd ..
            print_success "Baza zasiana danymi testowymi"
            ;;
        2)
            print_info "Używam lokalnej PostgreSQL"
            print_warning "Upewnij się że PostgreSQL działa lokalnie"
            
            print_info "Uruchamianie migracji..."
            cd backend
            npm run migrate
            cd ..
            print_success "Migracje ukończone"
            
            print_info "Zasianie bazy..."
            cd backend
            npm run seed
            cd ..
            print_success "Baza zasiana"
            ;;
        3)
            print_warning "Pominięto konfigurację bazy"
            ;;
    esac
}

setup_mapbox() {
    print_header "${MAP}Konfiguracja Mapbox"
    
    echo "Parkchain wymaga tokena Mapbox do map."
    echo ""
    print_info "Pobierz darmowy token: https://account.mapbox.com/"
    echo ""
    
    read -p "Czy masz token Mapbox? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Wpisz token Mapbox: " MAPBOX_TOKEN
        
        if [ -n "$MAPBOX_TOKEN" ]; then
            sed -i.bak "s/MAPBOX_ACCESS_TOKEN=.*/MAPBOX_ACCESS_TOKEN=$MAPBOX_TOKEN/" .env
            print_success "Token Mapbox skonfigurowany"
        fi
    else
        print_warning "Mapbox nie skonfigurowany. Mapa nie będzie działać."
    fi
}

final_steps() {
    print_header "${ROCKET} Instalacja ukończona!"
    
    echo ""
    print_success "Parkchain został skonfigurowany!"
    echo ""
    
    print_info "Następne kroki:"
    echo ""
    echo "  ${WRENCH} Tryb deweloperski:"
    echo "    make dev"
    echo ""
    echo "  ${DATABASE} Baza danych:"
    echo "    make migrate"
    echo "    make seed"
    echo ""
    echo "  📚 Dokumentacja:"
    echo "    README.md"
    echo ""
    
    print_info "Adresy dostępu:"
    echo "  Frontend:  http://localhost:5173"
    echo "  Backend:   http://localhost:3000"
    echo "  pgAdmin:   http://localhost:5050"
    echo ""
    
    read -p "${ROCKET} Uruchomić Parkchain teraz? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        print_info "Uruchamianie Parkchain..."
        
        if command_exists docker-compose; then
            docker-compose up -d
            print_success "Parkchain działa z Docker!"
        else
            print_info "Uruchamianie ręcznie..."
            make dev &
            print_success "Parkchain działa!"
        fi
        
        echo ""
        print_info "Otwórz http://localhost:5173 w przeglądarce"
    fi
}

main() {
    clear
    
    echo -e "${PURPLE}"
    cat << "EOF"
    ____             __        __          _     
   / __ \____ ______/ /_______/ /_  ____ _(_)___ 
  / /_/ / __ `/ ___/ //_/ ___/ __ \/ __ `/ / __ \
 / ____/ /_/ / /  / ,< / /__/ / / / /_/ / / / / /
/_/    \__,_/_/  /_/|_|\___/_/ /_/\__,_/_/_/ /_/ 
                                                  
    Konfiguracja Parkchain
    
EOF
    echo -e "${NC}"
    
    print_info "Ten skrypt skonfiguruje Parkchain"
    echo ""
    read -p "Kontynuować? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Anulowano"
        exit 0
    fi
    
    check_prerequisites
    setup_env
    install_dependencies
    setup_database
    setup_mapbox
    final_steps
    
    echo ""
    print_success "🎉 Witaj w Parkchain!"
    echo ""
}

main