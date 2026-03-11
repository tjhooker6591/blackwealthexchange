# BWE Growth Dashboard Spec

## Weekly KPI groups

### Acquisition

- visitors
- visitor->signup
- channel mix
- referral share of new users

### Activation

- signup->first-action
- signup->first-purchase
- business/seller/employer activation rates

### Marketplace economics

- GMV total + by segment
- AOV
- repeat purchase rate
- take rate

### Network effects

- invites per active user
- creator-attributed GMV
- business profile share->visit->conversion
- employer repeat post rate

### Retention

- cohort retention (users/sellers/businesses/employers)

## Event dictionary (minimum)

- user_signup
- first_action
- first_purchase
- invite_sent / invite_accepted
- referral_conversion
- creator_click / creator_conversion
- business_profile_view / profile_share
- seller_product_published / first_order
- employer_post_created / applicant_submitted / hire_recorded

## Attribution model

- first-touch + assisted (referral/creator/business node)
- campaign code and UTM required for creator/partner activity
