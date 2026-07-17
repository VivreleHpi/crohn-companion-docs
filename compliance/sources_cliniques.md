# Sources cliniques

Échelles et scores utilisés dans l'application, avec leurs références et limites.

## Échelle de Bristol (Bristol Stool Form Scale)

- **Usage dans l'app** : classification des selles de type 1 à 7.
- **Référence** : Lewis SJ, Heaton KW. *Stool form scale as a useful guide to intestinal transit time.* Scand J Gastroenterol. 1997.
- **Limite** : outil descriptif auto-déclaré ; ne mesure pas l'inflammation.

## Index de Harvey-Bradshaw (HBI)

- **Usage dans l'app** : score Harvey-Bradshaw saisi à partir des réponses déclarées par
  l'utilisateur (bien-être, douleur, selles liquides, masse abdominale, complications), présenté
  comme repère indicatif de suivi.
- **Référence** : Harvey RF, Bradshaw JM. *A simple index of Crohn's-disease activity.* Lancet. 1980.
- **Formule, seuils, version et date de relecture** : documentés dans `compliance/hbi_calcul.md`.
- **Limites affichées dans l'app** : score déclaratif, non substituable à une évaluation
  clinique ; les seuils affichés doivent rester formulés comme des repères, pas comme un état de
  la maladie.
- **Statut** : le calcul est couvert par des tests unitaires ; une relecture médicale versionnée
  par un gastro-entérologue reste à obtenir avant toute revendication clinique.

## Signal de suivi (heuristique interne)

- **Usage dans l'app** : signal non-diagnostique combinant sévérité déclarée, présence de sang
  et type Bristol (voir `src/lib/clinicalStatus.ts`).
- **Statut** : heuristique interne, **non validée cliniquement**, présentée comme un simple
  support de discussion. Ses facteurs sont explicables et affichés.

## Cadres de référence produit

- HAS — Référentiel de bonnes pratiques sur les applications et objets connectés en santé (mHealth).
- CNIL — Recommandation relative aux applications mobiles.
- ANS — Référencement Mon espace santé (cible de moyen terme, non revendiquée aujourd'hui).
