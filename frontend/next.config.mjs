/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'placehold.co' },
			{ protocol: 'https', hostname: 'via.placeholder.com' },
			// OEM & CDN domains
			{ protocol: 'https', hostname: 'tmna.aemassets.toyota.com' },
			{ protocol: 'https', hostname: 'automobiles.honda.com' },
			{ protocol: 'https', hostname: 'www.ford.com' },
			{ protocol: 'https', hostname: 'www.chevrolet.com' },
			{ protocol: 'https', hostname: 'www.nissanusa.com' },
			{ protocol: 'https', hostname: 'www.hyundaiusa.com' },
			{ protocol: 'https', hostname: 'www.kia.com' },
			{ protocol: 'https', hostname: 'www.subaru.com' },
			{ protocol: 'https', hostname: 'bmw.scene7.com' },
			{ protocol: 'https', hostname: 'www.mbusa.com' },
			{ protocol: 'https', hostname: 'www.audiusa.com' },
			{ protocol: 'https', hostname: 'nar.media.audi.com' },
			{ protocol: 'https', hostname: 'digitalassets.tesla.com' },
			{ protocol: 'https', hostname: 'assets.volkswagen.com' },
			{ protocol: 'https', hostname: 'www.vw.com' },
			{ protocol: 'https', hostname: 'www.lexus.com' },
			{ protocol: 'https', hostname: 'images-porsche.imgix.net' },
			{ protocol: 'https', hostname: 'jlr.scene7.com' },
			{ protocol: 'https', hostname: 'www.volvocars.com' },
			{ protocol: 'https', hostname: 'www.jeep.com' },
			{ protocol: 'https', hostname: 'www.gmc.com' },
			{ protocol: 'https', hostname: 'www.dodge.com' },
			{ protocol: 'https', hostname: 'www.mazdausa.com' },
			{ protocol: 'https', hostname: 'www.miniusa.com' },
			{ protocol: 'https', hostname: 'www.alfaromeousa.com' },
			{ protocol: 'https', hostname: 'www.marutisuzuki.com' },
			{ protocol: 'https', hostname: 's7ap1.scene7.com' },
			{ protocol: 'https', hostname: 'www.hyundai.com' },
			{ protocol: 'https', hostname: 'www.kia.com' },
			{ protocol: 'https', hostname: 'www.mgmotor.co.in' },
			{ protocol: 'https', hostname: 'toyotabharatimages.toyotabharat.com' },
			{ protocol: 'https', hostname: 'www.jeep-india.com' },
			{ protocol: 'https', hostname: 'cdn.ferrari.com' },
			{ protocol: 'https', hostname: 'www.lamborghini.com' },
			{ protocol: 'https', hostname: 'auto.mahindra.com' },
			{ protocol: 'https', hostname: 'www.skoda-auto.co.in' }
		],
	},
};

export default nextConfig;
