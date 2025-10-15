// Centralized movies data used for local fallbacks
// This mirrors the previous inline moviesData from Home.tsx

import poster1 from '../assets/posters/id1.jpg'
import poster2 from '../assets/posters/id2.jpg'
import poster3 from '../assets/posters/id3.jpg'
import poster4 from '../assets/posters/id4.jpg'
import poster5 from '../assets/posters/id5.jpg'
import poster6 from '../assets/posters/id6.jpg'
import poster7 from '../assets/posters/id7.jpg'
import poster8 from '../assets/posters/id8.webp'
import poster9 from '../assets/posters/id9.jpg'
import poster10 from '../assets/posters/id10.jpg'
import poster11 from '../assets/posters/id11.webp'
import poster12 from '../assets/posters/id12.jpg'
import poster13 from '../assets/posters/id13.webp'
import poster14 from '../assets/posters/id14.jpg'
import poster15 from '../assets/posters/id15.jpg'
import poster16 from '../assets/posters/id16.jpg'
import poster17 from '../assets/posters/id17.jpg'
import poster18 from '../assets/posters/id18.jpg'
import poster19 from '../assets/posters/id19.jpg'
import poster20 from '../assets/posters/id20.jpg'
import poster21 from '../assets/posters/id21.jpg'
import poster22 from '../assets/posters/id22.jpg'
import poster23 from '../assets/posters/id23.webp'
import poster24 from '../assets/posters/id24.jpg'
import poster25 from '../assets/posters/id25.jpg'
import poster26 from '../assets/posters/id26.jpg'
import poster27 from '../assets/posters/id27.jpg'
import poster28 from '../assets/posters/id28.jpg'
import poster29 from '../assets/posters/id29.jpg'
import poster30 from '../assets/posters/id30.jpg'

export type LocalMovie = {
  id: string
  title: string
  poster: string
  trailer: string
  releaseDate?: string
}

export const moviesData: LocalMovie[] = [
  { id: '1', title: 'Tron: Ares', poster: poster1, trailer: 'https://www.youtube.com/watch?v=TronAresTrailer' },
  { id: '2', title: 'Predator: Badlands', poster: poster2, trailer: 'https://www.youtube.com/watch?v=PredatorBadlandsTrailer' },
  { id: '3', title: 'Kiss of the Spider Woman', poster: poster3, trailer: 'https://www.youtube.com/watch?v=KissOfTheSpiderWomanTrailer' },
  { id: '4', title: 'The Carpenter’s Son', poster: poster4, trailer: 'https://www.youtube.com/watch?v=TheCarpentersSonTrailer' },
  { id: '5', title: 'A House of Dynamite', poster: poster5, trailer: 'https://www.youtube.com/watch?v=AHouseOfDynamiteTrailer' },
  { id: '6', title: 'Soul on Fire', poster: poster6, trailer: 'https://www.youtube.com/watch?v=SoulOnFireTrailer' },
  { id: '7', title: 'The Bride', poster: poster7, trailer: 'https://www.youtube.com/watch?v=TheBrideTrailer' },
  { id: '8', title: 'The Woman in Cabin 10', poster: poster8, trailer: 'https://www.youtube.com/watch?v=TheWomanInCabin10Trailer' },
  { id: '9', title: '8 Femmes', poster: poster9, trailer: 'https://www.youtube.com/watch?v=8FemmesTrailer' },
  { id: '10', title: 'The Holy Mountain', poster: poster10, trailer: 'https://www.youtube.com/watch?v=TheHolyMountainTrailer' },

  { id: '11', title: 'The Smashing Machine', poster: poster11, trailer: 'https://www.youtube.com/watch?v=TheSmashingMachineTrailer' },
  { id: '12', title: 'After the Hunt', poster: poster12, trailer: 'https://www.youtube.com/watch?v=AfterTheHuntTrailer' },
  { id: '13', title: 'Baaghi 4', poster: poster13, trailer: 'https://www.youtube.com/watch?v=Baaghi4Trailer' },
  { id: '14', title: 'Sarkeet', poster: poster14, trailer: 'https://www.youtube.com/watch?v=SarkeetTrailer' },
  { id: '15', title: 'How to Train Your Dragon', poster: poster15, trailer: 'https://www.youtube.com/watch?v=HowToTrainYourDragon2025Trailer' },
  { id: '16', title: 'Green Lantern', poster: poster16, trailer: 'https://www.youtube.com/watch?v=GreenLantern2025Trailer' },
  { id: '17', title: 'Lilo & Stitch Live Action', poster: poster17, trailer: 'https://www.youtube.com/watch?v=LiloStitchLiveActionTrailer' },
  { id: '18', title: 'Jurassic World 4: Extinction', poster: poster18, trailer: 'https://www.youtube.com/watch?v=JurassicWorld4ExtinctionTrailer' },
  { id: '19', title: 'Captain America: Brave New World', poster: poster19, trailer: 'https://www.youtube.com/watch?v=CaptainAmericaBraveNewWorldTrailer' },
  { id: '20', title: 'The Invisible Force', poster: poster20, trailer: 'https://www.youtube.com/watch?v=TheInvisibleForceTrailer' },

  { id: '21', title: 'Roofman', poster: poster21, trailer: 'https://www.youtube.com/watch?v=RoofmanTrailer' },
  { id: '22', title: 'Kambi Katna Kathai', poster: poster22, trailer: 'https://www.youtube.com/watch?v=KambiKatnaKathaiTrailer' },
  { id: '23', title: 'The Ballad of a Small Player', poster: poster23, trailer: 'https://www.youtube.com/watch?v=TheBalladOfASmallPlayerTrailer' },
  { id: '24', title: 'Mr. K', poster: poster24, trailer: 'https://www.youtube.com/watch?v=MrKTrailer' },
  { id: '25', title: 'Dear Luke, Love, Me', poster: poster25, trailer: 'https://www.youtube.com/watch?v=DearLukeLoveMeTrailer' },
  { id: '26', title: 'Springsteen: Deliver Me From Nowhere', poster: poster26, trailer: 'https://www.youtube.com/watch?v=SpringsteenDeliverMeFromNowhereTrailer' },
  { id: '27', title: 'Soul on Fire', poster: poster27, trailer: 'https://www.youtube.com/watch?v=SoulOnFireTrailer' },
  { id: '28', title: 'Re-Election', poster: poster28, trailer: 'https://www.youtube.com/watch?v=ReElectionTrailer' },
  { id: '29', title: 'Caramelo', poster: poster29, trailer: 'https://www.youtube.com/watch?v=CarameloTrailer' },
  { id: '30', title: 'Bugonia', poster: poster30, trailer: 'https://www.youtube.com/watch?v=BugoniaTrailer' },
]

// Populate releaseDate for Coming Soon (indices 10-19) and New Releases (20-29)
const MS_DAY = 24 * 60 * 60 * 1000
const comingSoonOffsets = [14, 21, 28, 35, 18, 24, 31, 42, 20, 38]
for (let i = 0; i < comingSoonOffsets.length; i++) {
  const idx = 10 + i
  const d = new Date(Date.now() + comingSoonOffsets[i] * MS_DAY)
  ;(moviesData[idx] as any).releaseDate = d.toISOString()
}

const newReleaseOffsets = [2, 5, 1, 3, 7, 10, 4, 6, 12, 9]
for (let i = 0; i < newReleaseOffsets.length; i++) {
  const idx = 20 + i
  const d = new Date(Date.now() - newReleaseOffsets[i] * MS_DAY)
  ;(moviesData[idx] as any).releaseDate = d.toISOString()
}

export default moviesData
