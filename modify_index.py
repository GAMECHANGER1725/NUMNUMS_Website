import re

with open("index.html", "r") as f:
    content = f.read()

# Title
content = re.sub(
    r'<title>.*?</title>',
    r'<title>Eggless Custom Cakes Sydney | Num Num\'s Bakery | Harris Park & Riverstone</title>\n  <meta name="description" content="Order 100% eggless custom cakes in Sydney from Num Num\'s Bakery. Birthday, wedding and celebration cakes made fresh to order. Pick up from Harris Park or Riverstone.">',
    content,
    count=1
)

# Hero H1
content = re.sub(
    r'<h1[^>]*>.*?</h1\s*>',
    r'<h1 style="font-family:\'Cormorant Garamond\',Georgia,serif; font-size:clamp(3rem,7vw,5.5rem); font-weight:600; line-height:1.08; letter-spacing:-0.03em; color:#fff; margin:0 0 1.25rem;">\n        Sydney\'s 100% Eggless Custom Cake Bakery.\n      </h1>',
    content,
    flags=re.DOTALL,
    count=1
)

# Hero Subheading
content = re.sub(
    r'<p([^>]*)>\s*Sydney\'s favourite 100% eggless bakery\. Custom celebration cakes crafted with love — Harris Park &amp; Riverstone\.\s*</p>',
    r'<p\1>\n        Custom celebration cakes made fresh to order in Harris Park and Riverstone. No eggs. Ever. In any cake we make.\n      </p>',
    content
)

# Hero Buttons
content = re.sub(
    r'>Order Your Cake →<',
    r'>Order Your Cake via WhatsApp<',
    content
)
content = re.sub(
    r'>\s*Explore Our Cakes ↓\s*<',
    r'>\n          See Our Cakes\n        <',
    content
)

# Stats Bar
content = re.sub(
    r'8\+\s*Years',
    r'Since 2019',
    content
)

# Collections Section Header
content = re.sub(
    r'>\s*Made for Every Milestone\s*<',
    r'>\n          Custom Eggless Cakes for Every Occasion\n        <',
    content
)

# Collections Subheadline
content = re.sub(
    r'<p([^>]*)>\s*Handcrafted to order\. 100% eggless, always fresh\. Don\'t see what you\'re looking for\? We can recreate any design — just bring us a photo or your idea\.\s*</p>',
    r'<p\1>\n          Every cake is made to order. No eggs in anything we bake. Bring us a photo of any design and we will recreate it for your celebration.\n        </p>',
    content
)

# Wedding Cakes card body
content = re.sub(
    r'Elegant multi-tier designs for your perfect day\. 100% eggless, endlessly beautiful\.',
    r'Multi-tier eggless wedding cakes designed around your vision. Share a photo or describe what you want and we will build it from scratch.',
    content
)

# Kids Cakes card body
content = re.sub(
    r'Playful characters and vibrant designs — birthdays they\'ll never forget\.',
    r'Any character, any theme, any colour. Eggless birthday cakes that look exactly like the one your child has been pointing at on Pinterest.',
    content
)

# Baby Shower card body
content = re.sub(
    r'Soft pastels and sweet details — celebrating new arrivals in style\.',
    r'Soft, detailed, and made without eggs. Custom baby shower cakes for families who want something beautiful and inclusive.',
    content
)

# More from Our Menu card body
content = re.sub(
    r'Beyond cakes — a full bakery menu of handcrafted treats made fresh daily\.',
    r'Beyond cakes, our stores carry croissants, pastries, sweets, brownies and the Shake Cake, our signature cake-inside-a-milkshake creation.',
    content
)

# Why Choose Us Section
content = re.sub(
    r'>\s*Baked with Purpose,<br><em[^>]*>Crafted with Care</em>\s*<',
    r'>\n          Why Families Choose Num Num\'s\n        <',
    content
)

# We believe the best cakes should be inclusive...
content = re.sub(
    r'<p([^>]*)>\s*We believe the best cakes should be inclusive\. Every single cake we bake is 100% eggless — no exceptions\.\s*</p>',
    r'',
    content
) # Actually brief doesn't mentions the subheader of why choose us, so let's keep or remove? Wait, let's look at the brief carefully. Brief says:
# "Section header — replace current: Baked with Purpose, Crafted with Care" -> "Why Families Choose Num Num's"
# Wait, let's keep the paragraph beneath it unless instructed to change. The brief doesn't mention replacing "We believe the best cakes should be inclusive...", but I shouldn't be removing it if the brief didn't say to remove it. Ah, the brief only specified "Section header — replace current: Baked with Purpose, Crafted with Care". Let's *not* remove the paragraph.
