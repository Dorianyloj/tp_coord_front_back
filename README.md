# Coordination frontend / backend

## Quick Start

```bash
# 1. Cloner le repo
git clone https://github.com/Dorianyloj/tp_coord_front_back.git
cd tp_coord_front_back

# 2. Créer les fichiers d'environnement
cp .env-template .env
cp frontend/.env-template frontend/.env.local

# 3. Lancer la stack Docker
docker compose up -d --build

# 4. Attendre que tout soit prêt (~30s) puis accéder aux services :
#    - Frontend : http://localhost:3000
#    - Backend API : http://localhost:5005
#    - Hasura Console : http://localhost:8080
```

**Identifiants Hasura** : `hasura_admin_secret`

---

## Contenu du repository
Ce repository est constitué d'une application fullstack :
- Base de donnée **Postgresql** accessible sur le port `5440`
- Backend **Flask** accessible sur le port `5005`
- Frontend **Next JS** accessible sur le port `3000`
- **Hasura GraphQL** accessible sur le port `8080`

Le backend utilise l'ORM SQLAlchemy et possède trois modèles :
- User
- Company
- Product

Le frontend permet le CRUD du modèle *Product*

## Prérequis
La stack nécessite `docker` et `docker compose` pour fonctionner.

## Lancement de la stack
Veuillez réaliser les étapes suivantes pour executer la stack :
- **Backend** : Créez un fichier `.env` à partir du `.env-template` et complétez le avec les informations nécessaires.
- **Frontend** : Créez un fichier `.env.local` à partir du `.env-template` et complétez le avec les informations nécessaires.

Pour lancer la stack, executez la commande suivante :
```bash
docker compose watch
```

Au lancement, le service `db_migration_tp_coord_front_back` s'occupera d'appliquer les migrations de base de données managées par `SQLAlchemy`.

## Utilisation
Après le lancement, accèdez au backend flask à l'URL suivante pour vous créer un compte http://localhost:5005/register. Vous pourrez ensuite aller sur http://localhost:5005/login pour vous connecter.
L'API swagger est disponible à l'URL suivante :
http://localhost:5005/apidocs

---

## Hasura GraphQL

La console Hasura est accessible sur http://localhost:8080
**Admin Secret** : `hasura_admin_secret`

### Sauvegarder les métadonnées Hasura

Pour sauvegarder les métadonnées et les versionner, tu peux exporter via l'API après avoir configuré tes tables :

```bash
curl -d '{"type": "export_metadata", "args": {}}' \
  -H "X-Hasura-Admin-Secret: hasura_admin_secret" \
  http://localhost:8080/v1/metadata > hasura/metadata.json
```

### Réimporter les métadonnées

Pour réimporter les métadonnées plus tard :

```bash
curl -d "@hasura/metadata.json" \
  -H "X-Hasura-Admin-Secret: hasura_admin_secret" \
  http://localhost:8080/v1/metadata
```

---

## Authentification JWT

L'application utilise JWT pour l'authentification entre le frontend, le backend Flask et Hasura.

### Récupérer un token

**Via l'API** (pour le frontend ou tests) :
```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "votre_username", "password": "votre_password"}'
```

**Réponse** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "...", "email": "..." }
}
```

### Utiliser le token avec Hasura

```bash
curl -X POST http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_token>" \
  -d '{"query": "{ product { id name } }"}'
```

### Structure du token JWT

Le token contient des claims Hasura pour le contrôle d'accès :
```json
{
  "sub": "1",
  "exp": 1234567890,
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["user", "admin"],
    "x-hasura-default-role": "user",
    "x-hasura-user-id": "1",
    "x-hasura-company-id": "2"
  }
}
```

Ces claims permettent de configurer des permissions dans Hasura (ex: un user ne voit que les produits de sa company).

---

## Frontend GraphQL

Le frontend utilise GraphQL pour communiquer avec Hasura. Les fonctionnalités suivantes ont été mises en place :

### Types TypeScript générés (codegen)

Les types TypeScript sont générés automatiquement à partir du schéma GraphQL Hasura.

**Configuration** : `frontend/codegen.ts`

**Générer les types** :
```bash
cd frontend
npm run codegen
```

Les types sont générés dans `frontend/src/generated/graphql.ts`.

### Helper GraphQL

Un helper centralisé pour les requêtes GraphQL est disponible dans `frontend/src/lib/graphql.ts` :

```typescript
import { graphqlFetch } from '@/lib/graphql';
import type { GetProductsQuery } from '@/generated/graphql';

// Requête HTTP
const data = await graphqlFetch<GetProductsQuery>(GET_PRODUCTS);
```

### Subscriptions WebSocket (Temps réel)

Les composants `ProductList` et `CompanyList` supportent le mode temps réel via WebSocket.

- Cochez "Temps réel (WebSocket)" pour activer les subscriptions
- Les modifications dans Hasura apparaissent instantanément

**Accès** : http://localhost:3000/dashboard

---

## Tests

### Tests Frontend (Jest)

Les tests du composant ProductList sont dans `frontend/src/__tests__/`.

**Lancer les tests** :
```bash
cd frontend
npm test
```

**Tests couverts** :
- Affichage du loading
- Affichage des produits
- Affichage des erreurs
- Bouton refresh
- Checkbox temps réel
- Headers du tableau

### Tests Backend (pytest)

Les tests de l'endpoint `/api/product` sont dans `backend/tests/`.

**Lancer les tests** (dans le container Docker) :
```bash
docker exec backend_tp_coord_front_back bash -c "pip install pytest pytest-flask && pytest -v"
```

**Tests couverts** :
- GET tous les produits
- GET produit par ID
- POST créer un produit
- PUT modifier un produit
- DELETE supprimer un produit
- Filtrage par company_id
- Relations avec Company

---

## CI/CD (GitHub Actions)

Deux workflows sont configurés dans `.github/workflows/` :

### CI - Tests automatiques (`ci.yml`)

**Déclenché sur** : push/PR vers `main` ou `develop`

| Job | Description |
|-----|-------------|
| `test-frontend` | Install → Tests Jest → Build Next.js |
| `test-backend` | Setup PostgreSQL → Tests pytest |

### CD - Build & Push images (`cd.yml`)

**Déclenché sur** : push vers `main` ou tag `v*`

| Job | Description |
|-----|-------------|
| `build-frontend` | Build et push vers GHCR |
| `build-backend` | Build et push vers GHCR |

**Images publiées** :
- `ghcr.io/<username>/tp_coord_front_back/frontend:latest`
- `ghcr.io/<username>/tp_coord_front_back/backend:latest`

---

## Structure du projet

```
.
├── .github/workflows/      # CI/CD GitHub Actions
│   ├── ci.yml              # Tests automatiques
│   └── cd.yml              # Build & Push images
├── backend/
│   ├── apps/               # Application Flask
│   ├── tests/              # Tests pytest
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── __tests__/      # Tests Jest
│   │   ├── components/     # Composants React
│   │   ├── generated/      # Types GraphQL générés
│   │   ├── graphql/        # Queries/Mutations/Subscriptions
│   │   └── lib/            # Helper GraphQL
│   ├── codegen.ts          # Configuration codegen
│   ├── jest.config.cjs     # Configuration Jest
│   └── Dockerfile
├── hasura/                 # Métadonnées Hasura
└── docker-compose.yaml
```
---
