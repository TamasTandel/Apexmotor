// Seed script to populate the Car table with a broad set of makes/models.
// Run: npm run seed
// Static representative images (Unsplash) for stable display. Images are generic but close to each model.
// If you want 100% exact trim photos, replace URLs with your own hosted images or a CDN.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const IMAGE_MAP = {
  // Toyota
  'toyota-camry-se': 'https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2025/camry/se/2561/218/1/1.png?fmt=png-alpha&wid=1600',
  'toyota-rav4-xle': 'https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2025/rav4/xle/4440/3t3/1/1.png?fmt=png-alpha&wid=1600',
  'toyota-tacoma-trd-off-road': 'https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2024/tacoma/trd-offroad/7558/1j9/1/1.png?fmt=png-alpha&wid=1600',
  // Honda
  'honda-civic-ex': 'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2026/civic-sedan/Hero/MY26_Civic-Sedan_VLP-Hero_2000x1124.jpg',
  'honda-accord-touring-hybrid': 'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2025/accord-sedan/Hero/2025-accord-sedan-touring-hybrid-hp-hero-2000x1125.jpg',
  'honda-cr-v-sport-hybrid': 'https://automobiles.honda.com/-/media/Honda-Automobiles/Vehicles/2025/cr-v/Hybrid-Hero/2025-cr-v-sport-touring-hybrid-hp-hero-2000x1125.jpg',
  // Ford
  'ford-f-150-lariat': 'https://www.ford.com/is/image/content/dam/na/ford/en_us/images/f-150/2025/collections/3-2/25_F150_90A9117_fade_v5.tif?fmt=webp&wid=1600',
  'ford-mustang-gt-premium': 'https://www.ford.com/is/image/content/dam/brand_ford/en_us/brand/performance/mustang/2024/collections/3-2/24_FRD_MST_wdmp_200507_32.jpg?fmt=webp&wid=1600',
  'ford-explorer-st': 'https://www.ford.com/is/image/content/dam/vdm-ford/live/en_us/ford/nameplate/explorer/2025/collections/dm/24_FRD_EPR_40671_32.jpg?fmt=webp&wid=1600',
  // Chevrolet (switched to official Chevy site assets)
  'chevrolet-silverado-1500-lt': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/trucks/2025-silverado-1500/mov/01-images/2025-silverado-1500-lt-hero-01.png?imwidth=1600',
  'chevrolet-equinox-premier': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2026/suvs/equinox/mov/01-images/2026-equinox-intro-mh-01.jpg?imwidth=1600',
  'chevrolet-corvette-stingray-2lt': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2025/performance/stingray/mov/01-images/2025-stingray-masthead-01.png?imwidth=1600',
  // Nissan
  'nissan-altima-sr-awd': 'https://www.nissanusa.com/content/dam/Nissan/us/vehicles/altima/2025/gallery/exterior/2025-nissan-altima-sr-sedan-deep-pearl-blue-3qtr-front.jpg',
  'nissan-rogue-platinum': 'https://www.nissanusa.com/content/dam/Nissan/us/vehicles/rogue/2025/gallery/exterior/2025-nissan-rogue-platinum-hero-3qtr-front.jpg',
  'nissan-frontier-pro-4x': 'https://www.nissanusa.com/content/dam/Nissan/us/vehicles/frontier/2024/gallery/exterior/2024-nissan-frontier-pro-4x-3qtr-front.jpg',
  // Hyundai
  'hyundai-ioniq-5-limited-awd': 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5/images/2024/hyundai-2024-ioniq5-limited-ext-01.jpg',
  'hyundai-tucson-hybrid-limited': 'https://www.hyundaiusa.com/us/en/vehicles/tucson/images/2024/hyundai-2024-tucson-hybrid-limited-ext-01.jpg',
  // Kia
  'kia-telluride-sx-prestige': 'https://www.kia.com/content/dam/kia/us/en/vehicles/telluride/2025/mep/in-page-gallery/kia_telluride_2025_asset-carousel-2.jpg',
  'kia-ev6-wind-awd': 'https://www.kia.com/content/dam/kia/us/en/vehicles/ev6/2024/mep/gallery/kia_ev6_2024_gallery-01.jpg',
  // Subaru
  'subaru-outback-wilderness': 'https://www.subaru.com/content/dam/subaru/vehicles/2024/outback/trims/wilderness/2024-outback-wilderness-ice-silver-metallic-front-angle.png',
  'subaru-forester-touring': 'https://www.subaru.com/content/dam/subaru/vehicles/2024/forester/trims/touring/2024-forester-touring-cascade-green-silica-front-angle.png',
  // BMW
  'bmw-330i-xdrive': 'https://bmw.scene7.com/is/image/BMW/BMW-MY25-3series-DI24_000206956_G20_330i_Front-Retouched:3to2?fmt=webp&wid=1600',
  'bmw-x5-xdrive40i': 'https://bmw.scene7.com/is/image/BMW/BMW-MY25-G05-LCI-000154941:3to2?fmt=webp&wid=1600',
  'bmw-i4-edrive40': 'https://bmw.scene7.com/is/image/BMW/BMW-MY25-I4-GranCoupe-000182039:3to2?fmt=webp&wid=1600',
  // Mercedes-Benz
  'mercedes-benz-c-300-4matic': 'https://www.mbusa.com/content/dam/mb-nafta/us/myco/my25/c-class/class-page/series/2025-C-SEDAN-HERO-DR.jpg',
  'mercedes-benz-glc-300-4matic': 'https://www.mbusa.com/content/dam/mb-nafta/us/myco/my25/glc/suv/class-page/series/2025-GLC-SUV-HERO-DR.jpg',
  'mercedes-benz-eqe-350-plus': 'https://www.mbusa.com/content/dam/mb-nafta/us/myco/my24/eqe-350-sedan/class-page/series/2024-EQE-SEDAN-HERO-DR.jpg',
  // Audi
  'audi-a4-premium-plus-quattro': 'https://www.audiusa.com/content/dam/nemo/us/models/a4/a4-sedan/my-2024/1920x1080-desktop/1920x1080_AA4_L_181002_1.jpg',
  'audi-q5-prestige-quattro': 'https://www.audiusa.com/content/dam/nemo/us/models/q5/q5/my-2024/1920x1080-desktop/1920x1080_AQ5_191002.jpg',
  'audi-e-tron-gt-premium-plus': 'https://www.audiusa.com/content/dam/nemo/us/models/e-tron-gt/my-2024/1920x1080-desktop/1920x1080_AETG_D_191001.jpg',
  'tesla-model-3-long-range-awd': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD-v2.jpg',
  'tesla-model-y-performance': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.png',
  // Volkswagen (using official hero images)
  'volkswagen-tiguan-sel-r-line': 'https://www.vw.com/assets/vwcom/pages/vehicle_card/MY24-Tiguan-SEL-RLine-Card.png',
  'volkswagen-id-4-pro-s-awd': 'https://www.vw.com/assets/vwcom/pages/vehicle_card/MY24-ID4-ProS-AWD-Card.png',
  // Luxury & performance brands (moved to official sources where available)
  'lexus-rx-350h-awd': 'https://www.lexus.com/content/dam/lexus/images/models/rx-hybrid/2025/rxh/overview/lexus-rxh-overlay-hero-1204x677-LEX-RXH-MY25-0001.png',
  'lexus-es-300h': 'https://www.lexus.com/content/dam/lexus/images/models/es-hybrid/2025/esh/overview/lexus-esh-hero-overlay-1204x677-LEX-ESH-MY25-0002.png',
  'porsche-macan-s': 'https://images-porsche.imgix.net/-/media/8BBA6C8DD04A4A31A7B5D1B6D208779E_54404A391D134889A9DEEFF9AA46960B_MA23T3COX0006-macan-s-topview?w=900&auto=format',
  // Keep 911 on third-party temporarily until a stable Carrera S hero URL is captured
  'porsche-911-carrera-s': 'https://media.ed.edmunds-media.com/porsche/911/2024/oem/2024_porsche_911_coupe_carrera-s_fq_oem_1_1600.jpg',
  // Updated to official Porsche CDN below (will override later key merge if present)
  'jaguar-f-pace-p400-r-dynamic': 'https://jlr.scene7.com/is/image/jlr/X76124US_303101393_003_PR?wid=1200',
  'land-rover-defender-110-x-dynamic-se': 'https://jlr.scene7.com/is/image/jlr/L663_20MY_089_S_DX?wid=1200',
  'volvo-xc60-recharge-t8': 'https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt7d975b0e8f749165/679242acdbd5836c925af990/Spotlight_Hero-4x5.jpg?auto=avif&quality=85&format=webp&w=1080',
  'volvo-s60-recharge': 'https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt7bcb2c6c503370e0/668e5b3411c9006a7d0060c9/s60-hybrid-hero-1x1.jpg?auto=avif&quality=85&format=webp&w=1080',
  'jeep-wrangler-rubicon-4xe': 'https://www.jeep.com/content/dam/fca-brands/na/jeep/en_us/2025/wrangler/4xe/tablet/my25-jeep-wrangler-4xe-hero-main-inc-summer-event-tablet.jpg',
  'gmc-sierra-1500-at4x': 'https://www.gmc.com/content/dam/gmc/na/us/english/index/vehicles/2026/trucks/sierra-ld/overview/masthead/my26-sierra-1500-at4-masthead-1920x1440-26PGSRLD99198.jpg?imwidth=1600',
  'dodge-charger-scat-pack': 'https://www.dodge.com/content/dam/fca-brands/na/dodge/en_us/2024/charger/vlp/tablet/my25-dodge-lbcharger-hero-incentives-summer-event-tablet-v1.jpg',
  'mazda-cx-5-signature-awd': 'https://www.mazdausa.com/siteassets/vehicles/2025/cx-5/01_vlp/001_hero/desktop/2025-mazda-cx-5-crossover-suv_desktop?w=960',
  'mazda-mazda3-premium-awd': 'https://www.mazdausa.com/siteassets/vehicles/2025/mazda3-sedan/01_vlp/00_hero/desktop/2025-mazda-3-sedan-compact-car?w=960',
  'mini-cooper-s-hardtop': 'https://www.miniusa.com/content/dam/mini/vehicles/mini-hardtop2door/2025/desktop/F66%20-%20desktop.jpg.miniusaimg.medium.jpeg',
  'alfa-romeo-giulia-ti-awd': 'https://www.alfaromeousa.com/content/dam/alfa/us/giulia/2025/my25-alfa-giulia-overview-main-hero-mobile.jpg/jcr:content/renditions/tablet.jpg',
  'alfa-romeo-stelvio-veloce-awd': 'https://www.alfaromeousa.com/content/dam/alfa/us/stelvio/2025/overview/my25-alfa-stelvio-overview-main-hero-mobile.jpg/jcr:content/renditions/tablet.jpg',
  // Keep Ferrari & Lamborghini on third-party / interim until stable official assets captured
  'ferrari-roma': 'https://cdn.ferrari.com/cms/network/media/img/resize/5dcbcb852cdb32285a764c3c-m-ferrari-roma-intro-img?width=1600',
  'lamborghini-huracan-evo-rwd': 'https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/model/huracan/huracan-evo/00-overview/Huracan_Evo_over_01_m.jpg',
  // New additions
  'tesla-cybertruck-dual-motor-awd': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Desktop.jpg',
  'jeep-grand-cherokee-summit-reserve': 'https://www.jeep.com/content/dam/fca-brands/na/jeep/en_us/2025/grand-cherokee/vlp/tablet/my25-jeep-grand-cherokee-vlp-hero-main-inc-summer-event-tablet.jpg',
  'gmc-yukon-denali-ultimate': 'https://www.gmc.com/content/dam/gmc/na/us/english/index/vehicles/2025/suvs/yukon/overview/masthead/my25-yukon-mov-masthead-1280x960-25PGYK00081-v2.jpg?imwidth=1600',
  'mazda-mx-5-miata-rf-grand-touring': 'https://www.mazdausa.com/siteassets/vehicles/2025/mx-5-rf/01_vlp/000_hero/desktop/2025-mazda-mx-5-miata-rf-convertible-sports-car_desktop?w=960',
  'porsche-taycan-4s': 'https://images-porsche.imgix.net/-/media/5F3468201ACF4D2CA8B3012BC9FB9774_1605711B6C234CDFB427AECC09D32468_TA24Q3CIX0010-taycan-4s-side?w=900&auto=format',
  // Official Porsche 911 Carrera S hero (replace third-party)
  'porsche-911-carrera-s': 'https://images-porsche.imgix.net/-/media/C1B97784F6E044CF832C54915FBAB0C3_3DFB88BE89B6447788DF461B1F18E3EB_PU24_911_Carrera_S_Model.png?auto=format&w=900'
};
// Additional image mappings (phase 2 authenticity replacements)
Object.assign(IMAGE_MAP, {
  'toyota-corolla-le': 'https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2026/corolla/xse/1866/1k3/1/1.png?fmt=png-alpha&wid=1600',
  'toyota-highlander-xle': 'https://tmna.aemassets.toyota.com/is/image/toyota/toyota/jellies/max/2025/highlander/hybridlimited25thedition/2813/218/1/1.png?fmt=png-alpha&wid=1600',
  'ford-bronco-wildtrak': 'https://www.ford.com/is/image/content/dam/brand_ford/en_us/brand/suvs/bronco/2025/collections/dm/25_FRD_BRO_60024.tif?fmt=webp&wid=1600',
  'chevrolet-tahoe-high-country': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2025/suvs/tahoe/mov/01-images/2025-tahoe-high-country-hero-01.png?imwidth=1600',
  'nissan-pathfinder-platinum': 'https://www.nissanusa.com/content/dam/Nissan/us/vehicles/pathfinder/2024/gallery/exterior/2024-nissan-pathfinder-platinum-3qtr-front.jpg',
  'hyundai-santa-fe-calligraphy': 'https://s7d1.scene7.com/is/image/hyundai/2026-santa-fe-calligraphy-phantom-black-pearl?wid=1200&fmt=webp&qlt=85,0',
  'kia-sportage-sx-prestige': 'https://www.kia.com/content/dam/kia/us/en/vehicles/sportage/2026/mep/in-page-gallery/my26-sportage-ice-mep-gallery-1.jpg',
  'subaru-crosstrek-wilderness': 'https://s7d1.scene7.com/is/image/scom/SRD_XCF_360e_000?$1200w$&fmt=webp',
  'bmw-x3-xdrive30i': 'https://bmw.scene7.com/is/image/BMW/BMW-MY26-X3-P036_FB-1_G45-8737-Retouched-expanded-new:4to3?fmt=webp&wid=1600',
  'mercedes-benz-gls-450': 'https://www.mbusa.com/content/dam/mb-nafta/us/myco/my25/gls-class/gls-suv/class-page/series/2025-GLS-SUV-HERO-DR.jpg',
  'audi-q7-prestige': 'https://nar.media.audi.com/is/image/audinar/nemo/us/models/Q7/Q7/MY23/1920x1920_DSC_5122-build1-4.15.22-v1.jpg?wid=1600',
  'lexus-gx-550-overtrail': 'https://www.lexus.com/content/dam/lexus/images/models/gx/2024/overtrail/lexus-gx-overtrail-overlay-hero-1204x677-LEX-GXH-MY24-0003.png',
  'porsche-cayenne-s': 'https://images-porsche.imgix.net/-/media/034752EB47AE4F95B150AB27D8DEFCA6_F1EECDF081934A3F95419FDF98E2D73F_cayenne-s-side?w=900&auto=format',
  'land-rover-range-rover-sport-dynamic-se': 'https://jlr.scene7.com/is/image/jlr/L461_24MY_001_GL?wid=1200',
  'volvo-xc90-recharge': 'https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt0713b95a7377e63a/67ee48f494cb02cf02caef7b/overview-hero-4x5.jpg?auto=avif&quality=85&format=webp&w=1080',
  'jeep-gladiator-rubicon': 'https://www.jeep.com/content/dam/fca-brands/na/jeep/en_us/2025/gladiator/vlp/tablet/my25-jeep-gladiator-overview-hero-tablet.jpg',
  'gmc-hummer-ev-pickup': 'https://www.gmc.com/content/dam/gmc/na/us/english/index/shared-assets/jellybeans/2026/hummer/pickup/2026-hummer-ev-pickup-meteorite-metallic-1000x563.png?imwidth=1600',
  'dodge-durango-srt-392': 'https://www.dodge.com/content/dam/fca-brands/na/dodge/en_us/2025/durango/vlp/tablet/dodge-my25-durango-overview-hero-posterimage-tablet.jpg',
  'mazda-cx-90-turbo-s': 'https://www.mazdausa.com/siteassets/vehicles/2025/cx-90--cx-90-phev/01_cx-90-inline-vlp/02_utility/carousel/desktop/2025-mazda-cx-90-3-row-seating-configuration-options?w=1280',
  'mini-countryman-se-all4': 'https://www.miniusa.com/content/dam/mini/vehicles/countryman-ice/2025/desktop/MINI-U25-FMA-3840x1824.jpg.miniusaimg.medium.jpeg',
  'alfa-romeo-tonale-veloce': 'https://www.alfaromeousa.com/content/dam/alfa/us/tonale/2025/overview/my25-alfa-tonale-overview-hero-main-mobile.jpg/jcr:content/renditions/tablet.jpg',
  'tesla-model-s-plaid': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-Hero-Desktop-US.png',
  'tesla-model-x-long-range': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-X-Hero-Desktop-US.png',
  'ferrari-296-gtb': 'https://cdn.ferrari.com/cms/network/media/img/resize/60d0b484a3cd115f9176b3de-ferrari-296-gtb-intro-mob?width=1600',
  'lamborghini-revuelto': 'https://placehold.co/800x450?text=Revuelto+Hero+Pending',
  // India market (updated where official assets identified)
  'maruti-suzuki-swift-zxi-plus': 'https://www.marutisuzuki.com/-/media/Feature/CarModelName/Swift/Swift-Desktop.png',
  'maruti-suzuki-baleno-alpha': 'https://www.marutisuzuki.com/-/media/Feature/CarModelName/Baleno/baleno-home.png',
  'maruti-suzuki-brezza-zxi-plus': 'https://www.marutisuzuki.com/-/media/Feature/CarModelName/Brezza/brezza-home.png',
  'tata-nexon-fearless-plus': 'https://s7ap1.scene7.com/is/image/tatamotors/GrasslandBeige-0-2?$PO-750-500-S$&fit=crop&fmt=avif-alpha',
  'tata-punch-creative': 'https://s7ap1.scene7.com/is/image/tatamotors/punch-creative-1?$PO-750-500-S$&fit=crop&fmt=avif-alpha',
  'tata-harrier-fearless-plus': 'https://s7ap1.scene7.com/is/image/tatamotors/harrier-khaki-front?$PO-750-500-S$&fit=crop&fmt=avif-alpha',
  // Mahindra official media (representative hero angles)
  'mahindra-xuv700-ax7l': 'https://auto.mahindra.com/-/media/feature/xuv700/gallery/xuv700-exterior-1.png',
  'mahindra-scorpio-n-z8l': 'https://auto.mahindra.com/-/media/feature/scorpio-n/gallery/exterior/scorpio-n-exterior-1.png',
  'mahindra-thar-lx-4x4': 'https://auto.mahindra.com/-/media/feature/thar/gallery/exterior/thar-exterior-1.png',
  'hyundai-creta-sx-o': 'https://www.hyundai.com/content/dam/hyundai/in/en/data/find-a-car/Creta/Highlights/cretahighlightbig1.jpg',
  'hyundai-venue-sx-o': 'https://www.hyundai.com/content/dam/hyundai/in/en/data/find-a-car/venue/Highlights/highlights-fluidic-sculpture.jpg',
  'kia-seltos-gtx-plus': 'https://www.kia.com/content/dam/kia2/in/en/our-vehicles/showroom/seltos/seltos-desktop.png',
  'kia-sonet-gtx-plus': 'https://www.kia.com/content/dam/kia2/in/en/our-vehicles/showroom/sonet/sonet-desktop.png',
  'skoda-kushaq-style': 'https://www.skoda-auto.co.in/-/media/india/models/kushaq/new/gallery/kushaq-hero.png',
  'skoda-slavia-style': 'https://www.skoda-auto.co.in/-/media/india/models/slavia/gallery/slavia-hero.png',
  'volkswagen-virtus-gt-plus': 'https://assets.volkswagen.com/is/image/volkswagenag/virtus-desktop-new?wid=1280&hei=960&fmt=webp&fit=crop',
  'volkswagen-taigun-gt-plus': 'https://assets.volkswagen.com/is/image/volkswagenag/taigun-desktop-new?wid=1280&hei=960&fmt=webp&fit=crop',
  'mg-hector-sharp-pro': 'https://www.mgmotor.co.in/content/dam/mg_motor_india/hector/hector-car.png',
  'mg-zs-ev-exclusive': 'https://www.mgmotor.co.in/content/dam/mg_motor_india/zsev/new-zs-ev-car.png',
  'toyota-fortuner-legender-4x4-at': 'https://toyotabharatimages.toyotabharat.com/toyota-bharat/img/fortuner/fortuner-legender-hero.png',
  'jeep-meridian-limited-o': 'https://www.jeep-india.com/content/dam/cross-regional/apac/jeep-india/meridian/my24/vlp/mobile/my24-jeep-meridian-overview-hero.jpg'
});

const normKey = (make, model) => (
  (make + ' ' + model)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/\+/g,' plus ') // rewrite plus for consistency
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'')
);
const getImage = (make, model) => IMAGE_MAP[normKey(make, model)] || 'https://placehold.co/800x450?text=Car+Image';

// Optional: warn at seed time if an image URL is from a non-manufacturer domain (so we can replace later)
const MANUFACTURER_DOMAINS = [
  'toyota.com',
  'automobiles.honda.com',
  'ford.com',
  'nissanusa.com',
  'hyundaiusa.com',
  'kia.com',
  'subaru.com',
  'bmw.scene7.com',
  'mbusa.com',
  'audiusa.com',
  'audi.com',
  'digitalassets.tesla.com',
  'assets.volkswagen.com',
  'hyundai.com', // India Hyundai site
  'scene7.com', // Adobe Scene7 CDN used by some OEMs (Tata)
  'vw.com',
  'chevrolet.com',
  'lexus.com',
  'images-porsche.imgix.net',
  'jlr.scene7.com',
  'volvocars.com',
  'jeep.com',
  'gmc.com',
  'dodge.com',
  'mazdausa.com',
  'miniusa.com',
  'alfaromeousa.com',
  // India market manufacturer domains
  'marutisuzuki.com',
  'tatamotors.com',
  'mahindra.com',
  'skoda-auto.com',
  'mgmotor.com',
  'mgmotor.co.in',
  'toyotabharat.com',
  'jeep-india.com',
  // Allow interim until official Ferrari/Lamborghini hero assets are stable
  'ferrari.com',
  'lamborghini.com'
];
function isManufacturer(url){
  try { const h = new URL(url).hostname.replace(/^www\./,''); return MANUFACTURER_DOMAINS.some(d=>h.endsWith(d)); } catch { return false; }
}

const cars = [
  { make:'Toyota', model:'Camry SE', year:2023, price:28990, bodyType:'Sedan', features:['Bluetooth','Backup Camera','Lane Assist'] },
  { make:'Toyota', model:'RAV4 XLE', year:2024, price:34950, bodyType:'SUV', features:['AWD','Apple CarPlay','Adaptive Cruise'] },
  { make:'Toyota', model:'Tacoma TRD Off-Road', year:2023, price:41980, bodyType:'Truck', features:['4x4','Locking Differential','Android Auto'] },
  { make:'Honda', model:'Civic EX', year:2024, price:26940, bodyType:'Sedan', features:['Sunroof','Heated Seats','LaneWatch'] },
  { make:'Honda', model:'Accord Touring Hybrid', year:2024, price:39990, bodyType:'Sedan', features:['Hybrid','HUD','Adaptive Cruise'] },
  { make:'Honda', model:'CR-V Sport Hybrid', year:2024, price:37950, bodyType:'SUV', features:['Hybrid','AWD','Power Liftgate'] },
  { make:'Ford', model:'F-150 Lariat', year:2023, price:55990, bodyType:'Truck', features:['4x4','Tow Package','Remote Start'] },
  { make:'Ford', model:'Mustang GT Premium', year:2024, price:48990, bodyType:'Sports', features:['V8','Performance Pack','Leather'] },
  { make:'Ford', model:'Explorer ST', year:2024, price:57950, bodyType:'SUV', features:['AWD','3rd Row','Sport Tuned'] },
  { make:'Chevrolet', model:'Silverado 1500 LT', year:2023, price:47950, bodyType:'Truck', features:['4x4','Bed Liner','Trailering'] },
  { make:'Chevrolet', model:'Equinox Premier', year:2024, price:35990, bodyType:'SUV', features:['AWD','Panoramic Roof','Power Liftgate'] },
  { make:'Chevrolet', model:'Corvette Stingray 2LT', year:2024, price:73990, bodyType:'Sports', features:['Mid-Engine','Performance Exhaust','HUD'] },
  { make:'Nissan', model:'Altima SR AWD', year:2024, price:30990, bodyType:'Sedan', features:['AWD','ProPILOT Assist','Remote Start'] },
  { make:'Nissan', model:'Rogue Platinum', year:2024, price:38990, bodyType:'SUV', features:['AWD','Panoramic Roof','Leather'] },
  { make:'Nissan', model:'Frontier PRO-4X', year:2023, price:41990, bodyType:'Truck', features:['4x4','Off-Road Suspension','LED Lighting'] },
  { make:'Hyundai', model:'Ioniq 5 Limited AWD', year:2024, price:51990, bodyType:'EV', features:['AWD','Fast Charging','Driver Assist'] },
  { make:'Hyundai', model:'Tucson Hybrid Limited', year:2024, price:39990, bodyType:'SUV', features:['Hybrid','AWD','Smart Park'] },
  { make:'Kia', model:'Telluride SX-Prestige', year:2024, price:52990, bodyType:'SUV', features:['AWD','Nappa Leather','HUD'] },
  { make:'Kia', model:'EV6 Wind AWD', year:2024, price:48990, bodyType:'EV', features:['AWD','800V Charging','Meridian Audio'] },
  { make:'Subaru', model:'Outback Wilderness', year:2024, price:41990, bodyType:'SUV', features:['AWD','X-Mode','Raised Suspension'] },
  { make:'Subaru', model:'Forester Touring', year:2024, price:39950, bodyType:'SUV', features:['AWD','EyeSight','Panoramic Roof'] },
  { make:'BMW', model:'330i xDrive', year:2024, price:48990, bodyType:'Sedan', features:['AWD','iDrive 8','Leatherette'] },
  { make:'BMW', model:'X5 xDrive40i', year:2024, price:67990, bodyType:'SUV', features:['AWD','M Sport','Panoramic Roof'] },
  { make:'BMW', model:'i4 eDrive40', year:2024, price:57990, bodyType:'EV', features:['Electric','iDrive 8','Driver Assist'] },
  { make:'Mercedes-Benz', model:'C 300 4MATIC', year:2024, price:55990, bodyType:'Sedan', features:['AWD','MBUX','Ambient Lighting'] },
  { make:'Mercedes-Benz', model:'GLC 300 4MATIC', year:2024, price:58990, bodyType:'SUV', features:['AWD','Panoramic Roof','MBUX'] },
  { make:'Mercedes-Benz', model:'EQE 350+', year:2024, price:73990, bodyType:'EV', features:['Electric','MBUX Hyperscreen','Driver Assist'] },
  { make:'Audi', model:'A4 Premium Plus quattro', year:2024, price:48990, bodyType:'Sedan', features:['AWD','Virtual Cockpit','LED Matrix'] },
  { make:'Audi', model:'Q5 Prestige quattro', year:2024, price:56990, bodyType:'SUV', features:['AWD','Bang & Olufsen','Panoramic Roof'] },
  { make:'Audi', model:'e-tron GT Premium Plus', year:2023, price:92990, bodyType:'EV', features:['Electric','Quattro','Fast Charging'] },
  { make:'Tesla', model:'Model 3 Long Range AWD', year:2024, price:47990, bodyType:'EV', features:['Dual Motor','Autopilot','Glass Roof'] },
  { make:'Tesla', model:'Model Y Performance', year:2024, price:54990, bodyType:'EV', features:['Dual Motor','Performance Pack','Autopilot'] },
  { make:'Volkswagen', model:'Tiguan SEL R-Line', year:2024, price:39990, bodyType:'SUV', features:['AWD','Digital Cockpit','3rd Row'] },
  { make:'Volkswagen', model:'ID.4 Pro S AWD', year:2024, price:47990, bodyType:'EV', features:['Electric','AWD','Glass Roof'] },
  { make:'Lexus', model:'RX 350h AWD', year:2024, price:58990, bodyType:'SUV', features:['Hybrid','AWD','Mark Levinson'] },
  { make:'Lexus', model:'ES 300h', year:2024, price:46990, bodyType:'Sedan', features:['Hybrid','Safety System+','Ambient Lighting'] },
  { make:'Porsche', model:'Macan S', year:2024, price:73990, bodyType:'SUV', features:['AWD','Sport Chrono','Leather'] },
  { make:'Porsche', model:'911 Carrera S', year:2024, price:139990, bodyType:'Sports', features:['RWD','PDK','Sport Chrono'] },
  { make:'Jaguar', model:'F-PACE P400 R-Dynamic', year:2024, price:68990, bodyType:'SUV', features:['AWD','Meridian Audio','Adaptive Dynamics'] },
  { make:'Land Rover', model:'Defender 110 X-Dynamic SE', year:2024, price:79990, bodyType:'SUV', features:['AWD','Air Suspension','Terrain Response'] },
  { make:'Volvo', model:'XC60 Recharge T8', year:2024, price:63990, bodyType:'SUV', features:['PHEV','AWD','Pilot Assist'] },
  { make:'Volvo', model:'S60 Recharge', year:2024, price:55990, bodyType:'Sedan', features:['PHEV','Pilot Assist','Harman Kardon'] },
  { make:'Jeep', model:'Wrangler Rubicon 4xe', year:2024, price:61990, bodyType:'SUV', features:['PHEV','4x4','Off-Road+'] },
  { make:'GMC', model:'Sierra 1500 AT4X', year:2024, price:74990, bodyType:'Truck', features:['4x4','Multimatic DSSV','Off-Road'] },
  { make:'Dodge', model:'Charger Scat Pack', year:2023, price:54990, bodyType:'Sports', features:['V8','Brembo Brakes','Performance Seats'] },
  { make:'Mazda', model:'CX-5 Signature AWD', year:2024, price:40990, bodyType:'SUV', features:['AWD','Nappa Leather','Turbo'] },
  { make:'Mazda', model:'Mazda3 Premium AWD', year:2024, price:32990, bodyType:'Sedan', features:['AWD','Heads-Up Display','Turbo'] },
  { make:'Mini', model:'Cooper S Hardtop', year:2024, price:31990, bodyType:'Hatchback', features:['Turbo','Driving Modes','LED Headlights'] },
  { make:'Alfa Romeo', model:'Giulia Ti AWD', year:2024, price:50990, bodyType:'Sedan', features:['AWD','Alfa DNA','Leather'] },
  { make:'Alfa Romeo', model:'Stelvio Veloce AWD', year:2024, price:54990, bodyType:'SUV', features:['AWD','Alfa DNA','Leather'] },
  { make:'Ferrari', model:'Roma', year:2023, price:247000, bodyType:'Sports', features:['Twin-Turbo V8','Carbon Trim','Magneride'] },
  { make:'Lamborghini', model:'Huracán EVO RWD', year:2023, price:261000, bodyType:'Sports', features:['V10','Carbon-Ceramic Brakes','Magneto Suspension'] },
  // New inventory additions
  { make:'Tesla', model:'Cybertruck Dual Motor AWD', year:2024, price:79990, bodyType:'Truck', features:['Electric','AWD','Stainless Steel Exoskeleton'] },
  { make:'Jeep', model:'Grand Cherokee Summit Reserve', year:2025, price:63990, bodyType:'SUV', features:['4x4','Air Suspension','Luxury Interior'] },
  { make:'GMC', model:'Yukon Denali Ultimate', year:2025, price:94990, bodyType:'SUV', features:['4x4','Air Ride Suspension','Super Cruise'] },
  { make:'Mazda', model:'MX-5 Miata RF Grand Touring', year:2025, price:38520, bodyType:'Sports', features:['RWD','Retractable Fastback','Kinematic Posture Control'] },
  { make:'Porsche', model:'Taycan 4S', year:2025, price:123700, bodyType:'EV', features:['Electric AWD','800V Architecture','Performance Battery Plus'] },
  // --- India Market Batch (region IN) ---
  { make:'Maruti Suzuki', model:'Swift ZXi+', year:2025, price:8500, bodyType:'Hatchback', features:['1.2L Petrol','Dual Airbags','Touchscreen'], region:'IN', exShowroomPriceINR: 875000, specs:{ engine:'1.2L K-Series', powerHP:89, torqueNm:113, transmission:'5MT/AMT', mileageKmpl:24 } },
  { make:'Maruti Suzuki', model:'Baleno Alpha', year:2025, price:9900, bodyType:'Hatchback', features:['1.2L Petrol','HUD','6 Airbags'], region:'IN', exShowroomPriceINR: 1025000, specs:{ engine:'1.2L DualJet', powerHP:89, torqueNm:113, transmission:'5MT/AMT', mileageKmpl:22.3 } },
  { make:'Maruti Suzuki', model:'Brezza ZXi+', year:2025, price:13500, bodyType:'SUV', features:['1.5L Petrol','6 Airbags','360 Camera'], region:'IN', exShowroomPriceINR: 1490000, specs:{ engine:'1.5L K15C', powerHP:102, torqueNm:137, transmission:'5MT/6AT', mileageKmpl:19.8 } },
  { make:'Tata', model:'Nexon Fearless+', year:2025, price:16000, bodyType:'SUV', features:['1.2L Turbo','360 Camera','6 Airbags'], region:'IN', exShowroomPriceINR: 1550000, specs:{ engine:'1.2L Turbo Revotron', powerHP:118, torqueNm:170, transmission:'6MT/AMT/DCT', mileageKmpl:17.4 } },
  { make:'Tata', model:'Punch Creative', year:2025, price:10500, bodyType:'SUV', features:['1.2L Petrol','Projector Headlamps','5 Star GNCAP'], region:'IN', exShowroomPriceINR: 990000, specs:{ engine:'1.2L Revotron', powerHP:86, torqueNm:113, transmission:'5MT/AMT', mileageKmpl:20.1 } },
  { make:'Tata', model:'Harrier Fearless+', year:2025, price:27500, bodyType:'SUV', features:['2.0L Diesel','ADAS','Panoramic Roof'], region:'IN', exShowroomPriceINR: 2800000, specs:{ engine:'2.0L Kryotec Diesel', powerHP:167, torqueNm:350, transmission:'6MT/6AT', mileageKmpl:16.8 } },
  { make:'Mahindra', model:'XUV700 AX7L', year:2025, price:29500, bodyType:'SUV', features:['ADAS','Panoramic Roof','Diesel/Petrol'], region:'IN', exShowroomPriceINR: 2990000, specs:{ engine:'2.0L mStallion / 2.2L mHawk', powerHP:197, torqueNm:450, transmission:'6MT/6AT', mileageKmpl:15.5 } },
  { make:'Mahindra', model:'Scorpio-N Z8L', year:2025, price:27000, bodyType:'SUV', features:['4x4','Petrol/Diesel','Terrain Modes'], region:'IN', exShowroomPriceINR: 2750000, specs:{ engine:'2.2L mHawk / 2.0L mStallion', powerHP:200, torqueNm:400, transmission:'6MT/6AT', mileageKmpl:14.7 } },
  { make:'Mahindra', model:'Thar LX 4x4', year:2025, price:20500, bodyType:'SUV', features:['4x4','Removable Roof','ESP'], region:'IN', exShowroomPriceINR: 1680000, specs:{ engine:'2.2L Diesel / 2.0L Petrol', powerHP:150, torqueNm:320, transmission:'6MT/6AT', mileageKmpl:15 } },
  { make:'Hyundai', model:'Creta SX(O)', year:2025, price:21000, bodyType:'SUV', features:['ADAS','Panoramic Roof','10.25" Dual Screen'], region:'IN', exShowroomPriceINR: 2050000, specs:{ engine:'1.5L NA / 1.5L Turbo / 1.5L Diesel', powerHP:160, torqueNm:253, transmission:'6MT/IVT/DCT/AT', mileageKmpl:19 } },
  { make:'Hyundai', model:'Venue SX(O)', year:2025, price:15000, bodyType:'SUV', features:['Connected Car','6 Airbags','DCT'], region:'IN', exShowroomPriceINR: 1500000, specs:{ engine:'1.2L NA / 1.0L Turbo / 1.5L Diesel', powerHP:120, torqueNm:172, transmission:'5MT/6MT/IMT/DCT', mileageKmpl:20 } },
  { make:'Kia', model:'Seltos GTX+', year:2025, price:22500, bodyType:'SUV', features:['ADAS','360 Camera','Turbo'], region:'IN', exShowroomPriceINR: 2300000, specs:{ engine:'1.5L NA / 1.5L Diesel / 1.5L Turbo', powerHP:158, torqueNm:253, transmission:'6MT/IVT/6AT/DCT', mileageKmpl:18.6 } },
  { make:'Kia', model:'Sonet GTX+', year:2025, price:16000, bodyType:'SUV', features:['ADAS','Bose Audio','Turbo'], region:'IN', exShowroomPriceINR: 1550000, specs:{ engine:'1.2L NA / 1.0L Turbo / 1.5L Diesel', powerHP:118, torqueNm:172, transmission:'5MT/6MT/IMT/DCT/AT', mileageKmpl:19.5 } },
  { make:'Skoda', model:'Kushaq Style', year:2025, price:21500, bodyType:'SUV', features:['1.5L TSI','ESC','6 Airbags'], region:'IN', exShowroomPriceINR: 2050000, specs:{ engine:'1.0L / 1.5L TSI', powerHP:150, torqueNm:250, transmission:'6MT/AT/DSG', mileageKmpl:18 } },
  { make:'Skoda', model:'Slavia Style', year:2025, price:20000, bodyType:'Sedan', features:['1.5L TSI','Sunroof','6 Airbags'], region:'IN', exShowroomPriceINR: 1980000, specs:{ engine:'1.0L / 1.5L TSI', powerHP:150, torqueNm:250, transmission:'6MT/AT/DSG', mileageKmpl:19 } },
  { make:'Volkswagen', model:'Virtus GT Plus', year:2025, price:20500, bodyType:'Sedan', features:['1.5L TSI','Connected Car','6 Airbags'], region:'IN', exShowroomPriceINR: 2000000, specs:{ engine:'1.0L / 1.5L TSI', powerHP:150, torqueNm:250, transmission:'6MT/AT/DSG', mileageKmpl:19 } },
  { make:'Volkswagen', model:'Taigun GT Plus', year:2025, price:21000, bodyType:'SUV', features:['1.5L TSI','ESC','Panoramic Roof'], region:'IN', exShowroomPriceINR: 2100000, specs:{ engine:'1.0L / 1.5L TSI', powerHP:150, torqueNm:250, transmission:'6MT/AT/DSG', mileageKmpl:18.5 } },
  { make:'MG', model:'Hector Sharp Pro', year:2025, price:24000, bodyType:'SUV', features:['ADAS','Panoramic Roof','Voice Command'], region:'IN', exShowroomPriceINR: 2250000, specs:{ engine:'1.5L Turbo / 2.0L Diesel', powerHP:170, torqueNm:350, transmission:'6MT/CVT', mileageKmpl:15.5 } },
  { make:'MG', model:'ZS EV Exclusive', year:2025, price:33000, bodyType:'EV', features:['Electric','ADAS','Panoramic Roof'], region:'IN', exShowroomPriceINR: 2890000, specs:{ batteryKWh:50.3, rangeKm:461, motorPowerKW:130, torqueNm:280, charging: 'DC Fast 0-80% ~60min' } },
  { make:'Toyota', model:'Fortuner Legender 4x4 AT', year:2025, price:52000, bodyType:'SUV', features:['4x4','Diesel','7-Seater'], region:'IN', exShowroomPriceINR: 5200000, specs:{ engine:'2.8L Diesel', powerHP:201, torqueNm:500, transmission:'6AT', mileageKmpl:12.5 } },
  { make:'Jeep', model:'Meridian Limited (O)', year:2025, price:51500, bodyType:'SUV', features:['4x4','Diesel','ADAS'], region:'IN', exShowroomPriceINR: 4750000, specs:{ engine:'2.0L Diesel', powerHP:170, torqueNm:350, transmission:'6MT/9AT', mileageKmpl:14.5 } },
  // --- Global Expansion Batch ---
  { make:'Toyota', model:'Corolla LE', year:2025, price:23900, bodyType:'Sedan', features:['Toyota Safety Sense','LED Headlights','Apple CarPlay'] },
  { make:'Toyota', model:'Highlander XLE', year:2025, price:41900, bodyType:'SUV', features:['AWD','8" Display','Power Liftgate'] },
  { make:'Ford', model:'Bronco Wildtrak', year:2025, price:59990, bodyType:'SUV', features:['4x4','Sasquatch Package','Removable Roof'] },
  { make:'Chevrolet', model:'Tahoe High Country', year:2025, price:74990, bodyType:'SUV', features:['4x4','Magnetic Ride','HUD'] },
  { make:'Nissan', model:'Pathfinder Platinum', year:2025, price:50990, bodyType:'SUV', features:['AWD','ProPILOT Assist','Tow Package'] },
  { make:'Hyundai', model:'Santa Fe Calligraphy', year:2025, price:47990, bodyType:'SUV', features:['AWD','Panoramic Roof','Digital Key'] },
  { make:'Kia', model:'Sportage SX-Prestige', year:2025, price:38990, bodyType:'SUV', features:['AWD','Harman Kardon','ADAS'] },
  { make:'Subaru', model:'Crosstrek Wilderness', year:2025, price:34990, bodyType:'SUV', features:['AWD','Increased Ground Clearance','X-Mode'] },
  { make:'BMW', model:'X3 xDrive30i', year:2025, price:51990, bodyType:'SUV', features:['AWD','iDrive','Panoramic Roof'] },
  { make:'Mercedes-Benz', model:'GLS 450', year:2025, price:88990, bodyType:'SUV', features:['AWD','AIRMATIC','MBUX'] },
  { make:'Audi', model:'Q7 Prestige', year:2025, price:68990, bodyType:'SUV', features:['AWD','Virtual Cockpit','Adaptive Air Suspension'] },
  { make:'Lexus', model:'GX 550 Overtrail', year:2025, price:73990, bodyType:'SUV', features:['4x4','E-KDSS','Off-Road Tech'] },
  { make:'Porsche', model:'Cayenne S', year:2025, price:109900, bodyType:'SUV', features:['AWD','Twin-Turbo V6','Sport Chrono'] },
  { make:'Land Rover', model:'Range Rover Sport Dynamic SE', year:2025, price:93900, bodyType:'SUV', features:['AWD','Adaptive Dynamics','Terrain Response'] },
  { make:'Volvo', model:'XC90 Recharge', year:2025, price:78990, bodyType:'SUV', features:['PHEV','AWD','Pilot Assist'] },
  { make:'Jeep', model:'Gladiator Rubicon', year:2025, price:55990, bodyType:'Truck', features:['4x4','Rock-Trac','Off-Road+'] },
  { make:'GMC', model:'Hummer EV Pickup', year:2025, price:112000, bodyType:'Truck', features:['Electric','4x4','CrabWalk'] },
  { make:'Dodge', model:'Durango SRT 392', year:2025, price:74990, bodyType:'SUV', features:['AWD','392 V8','Brembo Brakes'] },
  { make:'Mazda', model:'CX-90 Turbo S', year:2025, price:55990, bodyType:'SUV', features:['AWD','Inline-6 Turbo','Premium Interior'] },
  { make:'Mini', model:'Countryman SE ALL4', year:2025, price:48990, bodyType:'EV', features:['Electric','ALL4','Digital Dash'] },
  { make:'Alfa Romeo', model:'Tonale Veloce', year:2025, price:47990, bodyType:'SUV', features:['PHEV','DNA Drive Mode','Adaptive Suspension'] },
  { make:'Tesla', model:'Model S Plaid', year:2025, price:114990, bodyType:'EV', features:['Tri Motor','Autopilot','Yoke Steering'] },
  { make:'Tesla', model:'Model X Long Range', year:2025, price:99990, bodyType:'EV', features:['Dual Motor','Falcon Wing Doors','Autopilot'] },
  { make:'Ferrari', model:'296 GTB', year:2025, price:342000, bodyType:'Sports', features:['Hybrid V6','E-Diff','Carbon Fiber'] },
  { make:'Lamborghini', model:'Revuelto', year:2025, price:608000, bodyType:'Sports', features:['Hybrid V12','AWD','Carbon Monocoque'] },
];

const bcrypt = require('bcrypt');

async function main() {
  console.log(`Seeding admin user (if absent) and ${cars.length} cars...`);
  const adminEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@123.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
  const hashed = await bcrypt.hash(process.env.ROOT_ADMIN_PASSWORD || 'admin@123', 10);
    try {
  await prisma.user.create({ data: { email: adminEmail, password: hashed, name: 'Root Admin', role: 'admin' } });
  console.log(`Created admin user => email: ${adminEmail} password: ${process.env.ROOT_ADMIN_PASSWORD || 'admin@123'}`);
    } catch (e) {
      console.warn('Standard Prisma create failed for admin user, attempting raw SQL insert (likely outdated client). Message:', e.message);
      try {
  await prisma.$executeRaw`INSERT INTO "public"."User" (email, password, name, role) VALUES (${adminEmail}, ${hashed}, ${'Root Admin'}, ${'admin'}) ON CONFLICT (email) DO NOTHING`;
  console.log(`Inserted admin user via raw SQL. email: ${adminEmail} password: ${process.env.ROOT_ADMIN_PASSWORD || 'admin@123'}`);
      } catch (rawErr) {
        console.error('Raw SQL admin insert failed:', rawErr);
      }
    }
  } else {
    // Attempt to ensure role is admin (if client supports role field)
    try {
      if (existingAdmin.role !== 'admin') {
        await prisma.user.update({ where: { id: existingAdmin.id }, data: { role: 'admin' } });
  console.log('Elevated existing user to admin =>', adminEmail);
      }
    } catch (e) {
      // Fallback raw update if prisma client missing field
      console.warn('Prisma update for role failed, trying raw SQL:', e.message);
      try { await prisma.$executeRaw`UPDATE "public"."User" SET role='admin' WHERE email=${adminEmail}`; console.log('Forced admin role via raw SQL.'); } catch (rawUpdErr) { console.error('Raw SQL role update failed:', rawUpdErr); }
    }
  }
  await prisma.car.deleteMany();
  for (const c of cars) {
      const image = getImage(c.make, c.model);
      // Basic category inference
      let category = c.category;
      const name = (c.make + ' ' + c.model).toLowerCase();
      if (!category) {
        if (/ev|electric|recharge|hybrid|phev|plug-in/.test(name)) category = 'EV';
        else if (/truck|pickup|cybertruck|tacoma|f-150|silverado|sierra/.test(name)) category = 'Truck';
        else if (/suv|gladiator|bronco|defender|harrier|meridian|fortuner|range rover|gls|gx|x5|x3|xc60|xc90|telluride|sportage|seltos|nexon|taigun|kushaq|thar|scorpio/.test(name)) category = 'SUV';
        else if (/coupe|convertible|roadster|miata|911|corvette|mustang|huracán|roma|revuelto|gtb|carrera|cayenne|taycan/.test(name)) category = 'Sports';
        else if (/lux|mercedes|bmw|audi|lexus|porsche|jaguar|land rover|range rover|ferrari|lamborghini|alfa romeo/.test(name)) category = 'Luxury';
        else if (/hatch|swift|baleno|cooper|countryman|punch|nexon/.test(name)) category = 'Hatchback';
        else if (/sedan|accord|civic|virtus|slavia/.test(name)) category = 'Sedan';
        else category = 'Standard';
      }
      if (/196|197|198|199/.test(String(c.year))) category = 'Vintage';
    if(!isManufacturer(image)) {
      console.warn('Non-official image domain for', c.make, c.model, '=>', image);
    }
      await prisma.car.create({ data: { ...c, image, category } });
  }
  console.log('Seeding complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });