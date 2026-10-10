/**
 * Word list for passphrases — common Czech nouns, deliberately WITHOUT diacritics
 * so the phrase can be typed on any keyboard (foreign laptop, phone, terminal).
 * `estimateEntropyBits` computes per-word entropy from the real list length
 * (log2(WORDS.length)), so adding/removing words breaks nothing.
 * The list is deduplicated on load.
 */
const RAW_WORDS = `
ahoj ananas angrest auto autobus babicka bageta bagr balon banan barva basta bazen becka bedna benzin
beran bilance bitva blesk bota boure bouda bramboru branka brasna brouk brzda bublina buben budik
bunda cedule cesta cibule cihla citron cukr cvicak cyklista dalekohled dama deka dest dilna divadlo
dlazba dlouho dobrota dohoda doktor domek dopis dort doupe drak drevo drob drak druh duha dum dvere
dynamo ekolog elektrika fazole fidlovacka fijaker film fiala flasa fontana forma fotka garaz gauc
globus guma hacek hadr hasic hlina hodiny holub homole hora hospoda hranol hrad hrebik hruska hrnek
hubka hudba hvezda chalupa chleba chodba chvile cirkus ctenar dalnice deska dvorek hrabe hrazda
jablko jahoda jehla jelen jezero jidlo jitrnice jizba kachna kafe kalendar kamen kampan kapusta
kapr karta kasna kastrol kavarna kazeta klec klic klobouk kluk kniha kocka kolac kolo komin kompas
kopec koren kos kost kotel kozel kralik kralovna kratky krava kridlo krabice kroupa kruh kryt
kudla kufr kuchyn kulicka kupka kure kvetina labut lampa lano lavice lekar les lezeni lilie linka
lis list litr lod loket lopata louka luzko lyzar lyze madlo majak makovice malina mapa maslo
medvěd medved mesic mesto meteor mlyn mraz mrak most motyl motor mouka mraveniste muzeum myska
nabytek nadrazi nakup namesti naradi nuz obchod oblak obraz obruc ocas ohen okno okurka oltar
ostrov oves ovce palec palma pamet panenka papir parek park pasta patro pavouk peklo pero pes pila
pistole pivo plaz plot plynu pocitac podlaha pohar pole polstar pomeranc ponorka popelnice potok
pramen prase prsten pstruh ptak pudr pumpa puntik pytel rameno raketa reka rohlik rosa rukavice
ruze ryba rybnik sacek sad salat sanky sekera sesit sir sklenice skrin slama slon slunce smetana
snih sova sporak sroub stan stolek strom studna stul sukne sul sused svetlo svicka sypak tabule
talir tanec taska tele teplo tesak tkanice trava trh trubka tuzka tyc ulice uzel vaza velryba
ventilator veverka vlak vlna voda vodopad vrabec vrata vrch vrtule vulkan vychod vydra vysavac
zahrada zakon zamek zapalka zavora zebra zelva zeme zidle zima zlato zvire zvonek zebrik zrcadlo
barak basa bota brusle cerveny dalnopis desert drevak dymka fiak foukacka hamak harfa herec hlavolam
hmyz hnizdo houba hrach hrbitov hustota jablon jeskyne kaktus kamna kanal karavan kobliha kominik
kotva kuze kvet lahev lesk lupa majitel mince mlha motylek muchomurka nebe necky nitka noha ocel
okurek ohrada orel ovoce papousek parnik pecivo pekar pila plamen plevel pliska pocasi poklad
polivka pomnik povidla prach praskavka prirodа prostor pruh pytlik radost rakev rebrik remen
rozmar rtenka rybar ryze sever sklad skorice slavik sleva slovnik smrk sneh sokol soused spona
sprcha stezka stin stodola stoh strecha strela struna sudy svet svitek sytost tajemstvi tajga
teleskop terc tkalec tma tovarna tucnak tulipan tunel turista udolí ulita uzdicka vanoce varhany
vejce velbloud vetev vichr vitr vlastovka vozik vrbа vrabcak vrana vyhled vyroba vyslanec zahon
zajic zaluzie zapad zebro zima zitrek zmrzlina znamka zub zvon zvedavec
`;

/** Normalization: lowercase a-z only, 3–8 characters, no duplicates. */
export const WORDS: readonly string[] = Array.from(
  new Set(
    RAW_WORDS.split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^[a-z]{3,8}$/.test(w)),
  ),
);
