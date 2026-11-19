# La Passe — Frontend

Interface web (et mobile) de gestion de restaurant : plan de salle, prise de commande, écran cuisine, addition, tableau de bord.

**Stack** : React 18 · TypeScript · MUI · Vite · Nginx (Docker).
Le backend est un projet séparé : `restaurant-backend` (il doit être démarré pour que l'application fonctionne).

## Qui fait quoi

| Rôle | Accès |
|---|---|
| **Serveur** | Plan de salle, prise de commande, addition et encaissement, « Servi » sur les plats prêts |
| **Cuisinier** | Écran cuisine en direct (actualisé toutes les 5 s, bip sur nouveau plat) |
| **Admin** | Tout ce qui précède + tableau de bord, carte, tables, dépenses, historique, équipe |

Sur mobile, la navigation se fait par la barre flottante du bas (bouton « + » = nouvelle commande, « Profil » = autres pages et déconnexion) ; sur grand écran, par le menu latéral.

## Lancement (Docker)

Démarrez d'abord le backend, puis :

```bash
cp .env.example .env
nano .env        # BACKEND_URL = adresse de l'API (voir ci-dessous)
docker compose up -d --build
```

Ouvrez `http://<ip-du-serveur>` (port réglable avec `APP_PORT`).

| Cas | `BACKEND_URL` |
|---|---|
| Backend sur la même machine | `http://host.docker.internal:8080` (défaut) |
| Backend sur une autre machine | `http://<ip-ou-domaine>:8080` |

Nginx sert l'application et relaie `/api/` vers `BACKEND_URL` (le backend n'a donc pas besoin de CORS). Si l'adresse n'est pas joignable au démarrage, le conteneur s'arrête : vérifiez `docker compose logs frontend`.

## Développement local

```bash
npm install
npm run dev      # http://localhost:5173, /api relayé vers http://localhost:8080
```

Pour pointer vers un autre backend : créez un `.env` avec `BACKEND_URL=http://<hôte>:8080`.
Autres commandes : `npm run build` (vérification TypeScript + build), `npm run preview`.

## Configuration

- `VITE_CURRENCY` (variable de build, `CURRENCY` dans `.env`) : devise affichée.
- Thème et couleurs : `src/theme.ts`. Navigation : `src/components/AppShell.tsx` (bureau) et `src/components/MobileNav.tsx` (mobile).
