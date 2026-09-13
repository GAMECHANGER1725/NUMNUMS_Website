/**
 * What each cake is, in the customer's words.
 *
 * ⚠️ NEEDS VAIDIK'S REVIEW. These are product claims about food. They were
 * written from the flavour name and the product photograph — what is visibly
 * on the cake — and from nothing else. Nobody has confirmed a single recipe.
 * Correct anything that is wrong before this is treated as published fact;
 * a wrong description is a complaint at the counter, and for an allergy it is
 * worse than that.
 *
 * Deliberately says nothing about ingredients beyond the flavour itself. The
 * base recipe is internal, and the allergen position lives in one place —
 * /terms section 6 — so it cannot drift across fifteen descriptions.
 */
export const FLAVOUR_COPY: Record<string, { blurb: string; note?: string }> = {
  "Chocolate": {
    blurb:
      "Our most ordered cake, and not by a small margin. Layers of eggless chocolate sponge under a dark chocolate finish, topped with cream.",
    note: "The safe choice when you are buying for a room full of people.",
  },
  "Butterscotch": {
    blurb:
      "Golden butterscotch through and through, with a caramel-toned glaze and a crunch of praline around the sides.",
  },
  "Pineapple": {
    blurb:
      "Light, fresh and not too sweet. Pineapple through soft eggless sponge with cream and a bright glaze on top.",
    note: "A favourite for warm afternoons and older guests.",
  },
  "Vanilla": {
    blurb:
      "Plain in the best sense. Soft eggless vanilla sponge and cream, finished with sprinkles — the cake children actually eat.",
  },
  "Rasmalai": {
    blurb:
      "The mithai everyone grew up with, built as a cake. Soft sponge, rasmalai cream and a saffron-toned finish.",
    note: "One of our two premium flavours, and the one people travel for.",
  },
  "Black Forest": {
    blurb:
      "The classic. Chocolate sponge, cream and cherries, finished with chocolate shavings around the sides.",
  },
  "Cookies & Cream": {
    blurb:
      "Cream cake through crushed cookie, with a chocolate drip and whole cookies on top.",
  },
  "White Forest": {
    blurb:
      "Black Forest's paler sibling — cream and cherries against white chocolate rather than dark.",
  },
  "Mango": {
    blurb:
      "Mango through soft sponge and cream under a glossy mango glaze. Sweet, bright and unmistakable.",
  },
  "Strawberry": {
    blurb: "Strawberry cream and sponge under a soft pink finish. Simple and popular with kids.",
  },
  "Red Velvet": {
    blurb:
      "Deep red sponge with cream, finished with red crumb around the base. As much a look as a flavour.",
  },
  "Lychee": {
    blurb:
      "Delicate and floral — lychee through cream and soft sponge, finished pale with rose petals.",
    note: "Lighter than it looks. Good after a heavy meal.",
  },
  "Tiramisu": {
    blurb:
      "Coffee and cream layered through sponge, dusted with cocoa and finished with cream swirls.",
    note: "The grown-up option on a table of birthday cakes.",
  },
  "Blueberry": {
    blurb: "Blueberry through cream and sponge under a bright glaze.",
  },
  "Ferrero Rocher": {
    blurb:
      "Chocolate and hazelnut, layered and finished with a chocolate drip and whole Ferrero Rocher on top.",
    note: "Our other premium flavour. Contains hazelnut — see our allergen note.",
  },
};

export const copyFor = (name: string) =>
  FLAVOUR_COPY[name] ?? { blurb: "A 100% eggless cake, made fresh to order." };
