# Geo Discord Bot

Bot Discord pour apprendre les drapeaux, les capitales et les départements !

## Installation
```
git clone https://github.com/kernoeb/geo_discord_bot
cd geo_discord_bot
echo "TOKEN=XXXXX" > token.env
docker-compose up -d --build
```

## Utilisation
```
- !geo help : aide
- !geo flag [loop] : devine le(s) drapeau(x)
- !geo capital [loop] : devine la ou les capitale(s)
- !geo dep [loop] : devine le ou les département(s) :flag_fr:
- !geo next : passe au suivant en mode boucle (ou "Je passe", "Suivant", ou "Next")
- !geo stop : termine la partie en cours 
```
