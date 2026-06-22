# echo.

> Journal émotionnel artistique propulsé par l'intelligence artificielle.

[![Déployé sur Vercel](https://img.shields.io/badge/Déployé%20sur-Vercel-black?style=flat&logo=vercel)](https://echojournal-two.vercel.app/)

**[echojournal-two.vercel.app](https://echojournal-two.vercel.app/)**

Echo transforme vos ressentis quotidiens en visualisations artistiques uniques. Vous écrivez, l'IA analyse vos émotions, et une oeuvre générée algorithmiquement s'ajoute à votre mosaïque personnelle.

---

## Fonctionnalités

- **Analyse émotionnelle** - 10 émotions détectées et scorées de 0 à 10 (joie, tristesse, colère, peur, sérénité, surprise, nostalgie, anxiété, espoir, frustration)
- **Visualisation générative** - 6 styles algorithmiques via Canvas HTML5 (géométrique, organique, aquarelle, minimaliste, abstrait, mosaïque)
- **Dictée vocale** - transcription automatique via Web Speech API
- **Check-in rapide** - enregistrement en 5 secondes sans écriture longue
- **Mosaïque personnelle** - grille de toutes vos entrées, filtrables par émotion
- **Vue constellation** - carte animée de vos émotions sous forme d'étoiles
- **Calendrier émotionnel** - historique coloré jour par jour
- **Rétrospective IA** - analyse narrative mensuelle générée par Claude
- **Lettres au futur soi** - programmées à 30, 90 ou 365 jours, envoyées par email
- **PWA** - installable sur mobile sans passer par les stores
- **Notifications push** - rappels doux personnalisables

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| Base de données | Supabase (PostgreSQL + RLS) |
| Authentification | Supabase Auth (email + Google OAuth) |
| IA - Analyse | Anthropic Claude Sonnet |
| IA - Images | Pollinations.ai (Premium) |
| Visualisation | Canvas HTML5 (algorithmes propriétaires) |
| Emails | Resend |
| Notifications | Web Push (VAPID) |
| Déploiement | Vercel |

---

## Installation

### Prérequis

- Node.js 18+
- Un projet Supabase
- Une clé API Anthropic (optionnel - fallback local disponible)
- Une clé API Resend

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/echo-app.git
cd echo-app
npm install
```

### 2. Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...

RESEND_API_KEY=re_...

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM...
VAPID_PRIVATE_KEY=xxx
```

> `ANTHROPIC_API_KEY` est optionnel. Sans clé, l'app utilise un moteur de détection par mots-clés en français.

### 3. Base de données

Dans votre projet Supabase, exécuter les fichiers SQL dans cet ordre :

```
supabase/schema.sql
supabase/future-letters.sql
supabase/shared-entries.sql
```

### 4. Clés VAPID (notifications push)

```bash
npx web-push generate-vapid-keys
```

Copier `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` dans `.env.local`.

### 5. Lancer en développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

---

## Architecture

```
src/
  app/                    # Pages et routes API (Next.js App Router)
    (auth)/               # Login, signup, reset-password
    dashboard/            # Mosaïque principale
    create/               # Flux création entrée (3 étapes)
    stats/                # Statistiques et rétrospective
    calendar/             # Calendrier émotionnel
    constellation/        # Vue étoiles animée
    letters/              # Lettres au futur soi
    api/                  # 14 routes API
  components/
    layout/               # Topbar, navigation
    ui/                   # Design system (toast, spinner, check-in rapide)
    mosaic/               # Modal de détail d'entrée
  lib/
    supabase/             # Clients SSR et browser
    visualization.ts      # Moteur Canvas 6 styles
    emotion-prompt.ts     # Builders de prompts IA
    rate-limit.ts         # Rate limiter in-memory
  types/                  # Types TypeScript globaux
```

---

## Flux principal

```
Utilisateur écrit -> POST /api/analyze -> Claude Sonnet
                                       -> Fallback mots-clés
                  -> generateVisualization() [Canvas client]
                  -> POST /api/entries -> Supabase PostgreSQL
                  -> Dashboard mis à jour
```

---

## Déploiement

Le projet est configuré pour Vercel. Chaque push sur `main` déclenche un déploiement automatique.

```bash
git push origin main
```

Ajouter toutes les variables d'environnement dans **Vercel - Settings - Environment Variables**.

Pour les jobs CRON (lettres futures, recap mensuel), ajouter dans `vercel.json` :

```json
{
  "crons": [
    { "path": "/api/letters/send", "schedule": "0 8 * * *" },
    { "path": "/api/recap/send", "schedule": "0 9 1 * *" }
  ]
}
```

---

## Modèle freemium

| Fonctionnalité | Essentielle (gratuit) | Premium (8€/mois) | Studio (24€/mois) |
|---|---|---|---|
| Entrées par mois | 50 | Illimitées | Illimitées |
| Styles visuels | 2 | 6 | 6 + exclusifs |
| Rétrospective IA | - | Mensuelle | Mensuelle + Annuelle |
| Images IA (Pollinations) | - | - | ✓ |
| Export HD | - | Standard | Poster + livre |

---

## Équipe

Projet réalisé dans le cadre du Master 2 MIAGE - Université Côte d'Azur (Juin 2026).

| Membre | Rôle |
|---|---|
| Marieme SARR | Présidente - Architecture & Backend |
| Man ZOU | Directrice IA & Data |
| Khadidiatou BEYE | Directrice Stratégie & Produit |
| Romain FRANCHI | Directeur Design & Frontend |

---

## Licence

Projet académique - tous droits réservés.
