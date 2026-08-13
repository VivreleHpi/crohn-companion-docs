# Calcul du score Harvey-Bradshaw Index (HBI)

> Version du calcul HBI : 1.0.0 (indépendante de la version produit CrohnApp)
> Dernière relecture : 2026-07-16 (relecture interne, non médicale — une relecture par un
> gastro-entérologue reste à planifier avant toute revendication clinique)

## Statut

Le score HBI affiché dans CrohnApp est **calculé à partir des données déclarées par
l'utilisateur**. Il constitue un repère de suivi. Il ne permet pas, à lui seul, de confirmer
une poussée, une rémission ou l'activité inflammatoire de la maladie. Aucune conclusion
automatique (rémission, poussée, stabilité, sévérité, urgence, efficacité d'un traitement)
n'est produite par l'application.

## Source

- Harvey RF, Bradshaw JM. *A simple index of Crohn's-disease activity.* The Lancet,
  1980;315(8167):514. PubMed : <https://pubmed.ncbi.nlm.nih.gov/6102236/>.

C'est la référence liée depuis l'application elle-même, sur l'écran de calcul du score.

## Formule appliquée

Somme de cinq composantes, telles que déclarées par l'utilisateur pour les dernières 24 h :

| Composante | Valeurs possibles |
| --- | --- |
| 1. Bien-être général | 0 (très bien) à 4 (terrible) |
| 2. Douleurs abdominales | 0 (aucune) à 3 (sévère) |
| 3. Nombre de selles liquides sur 24 h | 1 point par selle liquide (pré-rempli à partir des selles Bristol 6-7 saisies sur 24 h, modifiable avant validation) |
| 4. Masse abdominale | 0 (aucune) à 3 (définie et douloureuse) |
| 5. Complications actives | 1 point par complication cochée (arthralgie, uvéite/iritis, érythème noueux, pyoderma gangrenosum, aphtes, fissure anale, nouvelle fistule, abcès) |

`score = bien_être + douleur + selles_liquides + masse + nombre_de_complications`

## Seuils de repère affichés

Le calcul et les bandes de repère proviennent d'une source unique dans l'application, afin que
l'écran de calcul, le tableau de bord et la synthèse affichent toujours la même valeur. Les
libellés sont volontairement non diagnostiques :

| Score | Libellé affiché |
| --- | --- |
| < 5 | Repère HBI faible |
| 5 à 7 | Repère HBI intermédiaire |
| 8 à 16 | Repère HBI élevé |
| > 16 | Repère HBI très élevé |

Ces bandes reprennent les seuils usuels décrits dans la littérature pour le HBI, mais sont
présentées comme des repères de discussion, jamais comme rémission/poussée.

## Historique des versions

| Version | Date | Changement |
| --- | --- | --- |
| 1.0.0 | 2026-07-16 | Documentation initiale de la formule, des seuils et des libellés non diagnostiques. |

La formule n'a pas changé depuis. Le 13 août 2026, le calcul et les bandes ont été regroupés dans
une source unique côté application et couverts par des tests de valeur, afin d'écarter tout risque
de divergence entre les écrans. Le score affiché est inchangé.
