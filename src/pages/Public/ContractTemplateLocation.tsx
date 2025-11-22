export default function ContractTemplateLocation() {
  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
      <article className="space-y-4 text-sm leading-relaxed text-gray-700">

        <h2 className="text-lg font-semibold text-gray-900">Contrat de location de robes</h2>

        <p><strong>Entre les soussignés :</strong></p>

        <p>
          La société <strong>ALLURE CREATION</strong>, Société par actions simplifiée (SAS) immatriculée
          au registre du commerce et des sociétés sous le numéro <strong>9852878800014</strong>,
          ayant son siège social au <strong>4 avenue Laurent Cély, 92600 Asnières-sur-Seine</strong>,
          représentée par <strong>Madame Hassna NAFILI</strong> en qualité de gérante,
          ci-après dénommée « le Prestataire ».
        </p>

        <p>
          Et le Client, ci-après dénommé « la Cliente », identifié(e) dans le présent contrat.
        </p>

        <p><strong>Il a alors été convenu ce qui suit :</strong></p>

        {/* ========================== ARTICLE 1 ========================== */}
        <h3 className="font-semibold mt-4">Article 1 – Description</h3>
        <p>
          Le présent contrat a pour objet de définir les modalités selon lesquelles le Prestataire
          fournira à la Cliente un ensemble de services liés à la tenue de manifestations festives
          (mariage, fiançailles, cérémonies).
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Location des robes mariée, bijoux et accessoires (voiles, jupons).</li>
          <li>Location des robes invitées.</li>
        </ul>

        {/* ========================== ARTICLE 2 ========================== */}
        <h3 className="font-semibold mt-4">Article 2 – Conditions financières et caution</h3>
        <p>
          Un acompte de <strong>50 %</strong> du montant total de la location est exigé à la signature du contrat.
          Le solde est payable le jour de la récupération des robes, accompagné d’une caution.
        </p>
        <p>
          L’intégralité du paiement doit être effectuée selon ces modalités ; à défaut,
          la location ne pourra avoir lieu.
        </p>
        <p className="font-semibold text-red-600">
          ATTENTION : seules les cautions en empreinte CB ou en espèces sont acceptées.
          Aucun chèque ne sera accepté.
        </p>

        {/* ========================== ARTICLE 3 ========================== */}
        <h3 className="font-semibold mt-4">Article 3 – Résiliation / Annulation</h3>
        <p>
          Les contrats sont fermes et définitifs dès leur signature.
          Ils ne sont pas soumis au droit de rétractation prévu par l’article L212-20 du Code de la Consommation.
        </p>
        <p>
          L’acompte de 50 % versé reste acquis au Prestataire en cas d’annulation.
        </p>
        <p>
          La responsabilité du Prestataire ne pourra être engagée en cas de retard ou d’impossibilité
          d’exécution liée à un cas de force majeure, au sens de la jurisprudence de la Cour de cassation.
        </p>

        {/* ========================== ARTICLE 4 ========================== */}
        <h3 className="font-semibold mt-4">Article 4 – Responsabilité des parties</h3>
        <p>
          En cas de perte, dégât ou vol d’un article loué :
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>la caution sera conservée si le bien est abîmé (trou, tâche, brûlure, déchirure) ;</li>
          <li>si le bien est réparable, le montant des retouches sera déduit de la caution ;</li>
          <li>si le bien est perdu, volé ou irréparable, le Prestataire pourra réclamer le prix d’achat du bien.</li>
        </ul>
        <p>
          Aucune des parties n’est responsable en cas de force majeure conformément à la jurisprudence française.
        </p>

        {/* ========================== ARTICLE 5 ========================== */}
        <h3 className="font-semibold mt-4">Article 5 – Restitution</h3>
        <p>
          Les biens loués doivent être restitués <strong>le dimanche</strong> (pour les locations week-end)
          aux heures d’ouverture du showroom.
        </p>

        {/* ========================== ARTICLE 6 ========================== */}
        <h3 className="font-semibold mt-4">Article 6 – Retard de restitution</h3>
        <p>En cas de retard, les pénalités suivantes s’appliquent :</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>50 € par jour de retard et par robe invitée ;</li>
          <li>100 € par jour de retard et par robe mariée.</li>
        </ul>
        <p>
          Les biens doivent être retournés en <strong>parfait état</strong>. À défaut, une indemnité supplémentaire pourra être facturée.
        </p>

        {/* ========================== ARTICLE 7 ========================== */}
        <h3 className="font-semibold mt-4">Article 7 – Substitution</h3>
        <p>
          En cas d’impossibilité de fournir le bien réservé à la date souhaitée,
          ALLURE CREATION fournira un article de même catégorie ou de qualité supérieure,
          sans frais supplémentaires.
        </p>

        {/* ========================== ARTICLE 8 ========================== */}
        <h3 className="font-semibold mt-4">Article 8 – Non-restitution des accessoires</h3>
        <p>
          La non-restitution de la housse ou du cintre entraînera une indemnité forfaitaire
          de <strong>50 €</strong>.
        </p>

        {/* ========================== ENGAGEMENT ========================== */}
        <h3 className="font-semibold mt-4">Engagement et signature</h3>
        <p>
          En validant électroniquement ce contrat, la Cliente reconnaît avoir lu et accepté
          l’ensemble des conditions générales et particulières du présent document,
          qu’elle accepte sans réserve.
        </p>
      </article>
    </section>
  );
}