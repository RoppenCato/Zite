// The creatures on screen (chapter 1, step 4): the Art Director's atlases by enemy id, in the hero's form (`clips.ts`),
// and one small class that plays a figure's clips. A creature with no art yet is drawn as a circle by the fight scene.
// Files face left, toward the player; the enemy stands at the right, so it is not flipped.

import Phaser from 'phaser';
import banditData from '../../assets/bandit/bandit.json';
import banditJson from '../../assets/bandit/bandit.json?url';
import banditPng from '../../assets/bandit/bandit.png';
import beeData from '../../assets/bee/bee.json';
import beeJson from '../../assets/bee/bee.json?url';
import beePng from '../../assets/bee/bee.png';
import gooData from '../../assets/goo/goo.json';
import gooJson from '../../assets/goo/goo.json?url';
import gooPng from '../../assets/goo/goo.png';
import goo2Data from '../../assets/goo2/goo2.json';
import goo2Json from '../../assets/goo2/goo2.json?url';
import goo2Png from '../../assets/goo2/goo2.png';
import muncherData from '../../assets/muncher/muncher.json';
import muncherJson from '../../assets/muncher/muncher.json?url';
import muncherPng from '../../assets/muncher/muncher.png';
import slimeData from '../../assets/slime/slime.json';
import slimeJson from '../../assets/slime/slime.json?url';
import slimePng from '../../assets/slime/slime.png';
import sproutData from '../../assets/sprout/sprout.json';
import sproutJson from '../../assets/sprout/sprout.json?url';
import sproutPng from '../../assets/sprout/sprout.png';
import twiglingData from '../../assets/forest/twigling/twigling.json';
import twiglingJson from '../../assets/forest/twigling/twigling.json?url';
import twiglingPng from '../../assets/forest/twigling/twigling.png';
import mossGoblinData from '../../assets/forest/moss_goblin/moss_goblin.json';
import mossGoblinJson from '../../assets/forest/moss_goblin/moss_goblin.json?url';
import mossGoblinPng from '../../assets/forest/moss_goblin/moss_goblin.png';
import sporelingData from '../../assets/forest/sporeling/sporeling.json';
import sporelingJson from '../../assets/forest/sporeling/sporeling.json?url';
import sporelingPng from '../../assets/forest/sporeling/sporeling.png';
import nutkinData from '../../assets/forest/nutkin/nutkin.json';
import nutkinJson from '../../assets/forest/nutkin/nutkin.json?url';
import nutkinPng from '../../assets/forest/nutkin/nutkin.png';
import owlbearData from '../../assets/forest/owlbear/owlbear.json';
import owlbearJson from '../../assets/forest/owlbear/owlbear.json?url';
import owlbearPng from '../../assets/forest/owlbear/owlbear.png';
import grumblebarkData from '../../assets/forest/grumblebark/grumblebark.json';
import grumblebarkJson from '../../assets/forest/grumblebark/grumblebark.json?url';
import grumblebarkPng from '../../assets/forest/grumblebark/grumblebark.png';
import grumblebark2Data from '../../assets/forest/grumblebark2/grumblebark2.json';
import grumblebark2Json from '../../assets/forest/grumblebark2/grumblebark2.json?url';
import grumblebark2Png from '../../assets/forest/grumblebark2/grumblebark2.png';
import honeyBlobData from '../../assets/harvest/honey_blob/honey_blob.json';
import honeyBlobJson from '../../assets/harvest/honey_blob/honey_blob.json?url';
import honeyBlobPng from '../../assets/harvest/honey_blob/honey_blob.png';
import cornGoblinData from '../../assets/harvest/corn_goblin/corn_goblin.json';
import cornGoblinJson from '../../assets/harvest/corn_goblin/corn_goblin.json?url';
import cornGoblinPng from '../../assets/harvest/corn_goblin/corn_goblin.png';
import buzzbugData from '../../assets/harvest/buzzbug/buzzbug.json';
import buzzbugJson from '../../assets/harvest/buzzbug/buzzbug.json?url';
import buzzbugPng from '../../assets/harvest/buzzbug/buzzbug.png';
import appleMimicData from '../../assets/harvest/apple_mimic/apple_mimic.json';
import appleMimicJson from '../../assets/harvest/apple_mimic/apple_mimic.json?url';
import appleMimicPng from '../../assets/harvest/apple_mimic/apple_mimic.png';
import deckHandData from '../../assets/creatures_pirates/deck_hand/deck_hand.json';
import deckHandJson from '../../assets/creatures_pirates/deck_hand/deck_hand.json?url';
import deckHandPng from '../../assets/creatures_pirates/deck_hand/deck_hand.png';
import buccaneerData from '../../assets/creatures_pirates/buccaneer/buccaneer.json';
import buccaneerJson from '../../assets/creatures_pirates/buccaneer/buccaneer.json?url';
import buccaneerPng from '../../assets/creatures_pirates/buccaneer/buccaneer.png';
import scuttleCrabData from '../../assets/creatures_pirates/scuttle_crab/scuttle_crab.json';
import scuttleCrabJson from '../../assets/creatures_pirates/scuttle_crab/scuttle_crab.json?url';
import scuttleCrabPng from '../../assets/creatures_pirates/scuttle_crab/scuttle_crab.png';
import cheekyParrotData from '../../assets/creatures_pirates/cheeky_parrot/cheeky_parrot.json';
import cheekyParrotJson from '../../assets/creatures_pirates/cheeky_parrot/cheeky_parrot.json?url';
import cheekyParrotPng from '../../assets/creatures_pirates/cheeky_parrot/cheeky_parrot.png';
import firstMateData from '../../assets/creatures_pirates/first_mate_redwake/first_mate_redwake.json';
import firstMateJson from '../../assets/creatures_pirates/first_mate_redwake/first_mate_redwake.json?url';
import firstMatePng from '../../assets/creatures_pirates/first_mate_redwake/first_mate_redwake.png';
import saltjawData from '../../assets/creatures_pirates/captain_saltjaw/captain_saltjaw.json';
import saltjawJson from '../../assets/creatures_pirates/captain_saltjaw/captain_saltjaw.json?url';
import saltjawPng from '../../assets/creatures_pirates/captain_saltjaw/captain_saltjaw.png';
import saltjaw2Data from '../../assets/creatures_pirates/captain_saltjaw2/captain_saltjaw2.json';
import saltjaw2Json from '../../assets/creatures_pirates/captain_saltjaw2/captain_saltjaw2.json?url';
import saltjaw2Png from '../../assets/creatures_pirates/captain_saltjaw2/captain_saltjaw2.png';
import youngYetiData from '../../assets/creatures_giants/young_yeti/young_yeti.json';
import youngYetiJson from '../../assets/creatures_giants/young_yeti/young_yeti.json?url';
import youngYetiPng from '../../assets/creatures_giants/young_yeti/young_yeti.png';
import snowMonsterData from '../../assets/creatures_giants/snow_monster/snow_monster.json';
import snowMonsterJson from '../../assets/creatures_giants/snow_monster/snow_monster.json?url';
import snowMonsterPng from '../../assets/creatures_giants/snow_monster/snow_monster.png';
import frostOgreData from '../../assets/creatures_giants/frost_ogre/frost_ogre.json';
import frostOgreJson from '../../assets/creatures_giants/frost_ogre/frost_ogre.json?url';
import frostOgrePng from '../../assets/creatures_giants/frost_ogre/frost_ogre.png';
import icicleBatData from '../../assets/creatures_giants/icicle_bat/icicle_bat.json';
import icicleBatJson from '../../assets/creatures_giants/icicle_bat/icicle_bat.json?url';
import icicleBatPng from '../../assets/creatures_giants/icicle_bat/icicle_bat.png';
import oldSnowshoulderData from '../../assets/creatures_giants/old_snowshoulder/old_snowshoulder.json';
import oldSnowshoulderJson from '../../assets/creatures_giants/old_snowshoulder/old_snowshoulder.json?url';
import oldSnowshoulderPng from '../../assets/creatures_giants/old_snowshoulder/old_snowshoulder.png';
import yetiKingData from '../../assets/creatures_giants/yeti_king/yeti_king.json';
import yetiKingJson from '../../assets/creatures_giants/yeti_king/yeti_king.json?url';
import yetiKingPng from '../../assets/creatures_giants/yeti_king/yeti_king.png';
import yetiKing2Data from '../../assets/creatures_giants/yeti_king2/yeti_king2.json';
import yetiKing2Json from '../../assets/creatures_giants/yeti_king2/yeti_king2.json?url';
import yetiKing2Png from '../../assets/creatures_giants/yeti_king2/yeti_king2.png';
import cryptGuardData from '../../assets/creatures_crown/crypt_guard/crypt_guard.json';
import cryptGuardJson from '../../assets/creatures_crown/crypt_guard/crypt_guard.json?url';
import cryptGuardPng from '../../assets/creatures_crown/crypt_guard/crypt_guard.png';
import gildedWraithData from '../../assets/creatures_crown/gilded_wraith/gilded_wraith.json';
import gildedWraithJson from '../../assets/creatures_crown/gilded_wraith/gilded_wraith.json?url';
import gildedWraithPng from '../../assets/creatures_crown/gilded_wraith/gilded_wraith.png';
import stoneGargoyleData from '../../assets/creatures_crown/stone_gargoyle/stone_gargoyle.json';
import stoneGargoyleJson from '../../assets/creatures_crown/stone_gargoyle/stone_gargoyle.json?url';
import stoneGargoylePng from '../../assets/creatures_crown/stone_gargoyle/stone_gargoyle.png';
import goldMimicData from '../../assets/creatures_crown/gold_mimic/gold_mimic.json';
import goldMimicJson from '../../assets/creatures_crown/gold_mimic/gold_mimic.json?url';
import goldMimicPng from '../../assets/creatures_crown/gold_mimic/gold_mimic.png';
import lastStewardData from '../../assets/creatures_crown/last_steward/last_steward.json';
import lastStewardJson from '../../assets/creatures_crown/last_steward/last_steward.json?url';
import lastStewardPng from '../../assets/creatures_crown/last_steward/last_steward.png';
import hollowKingData from '../../assets/creatures_crown/hollow_king/hollow_king.json';
import hollowKingJson from '../../assets/creatures_crown/hollow_king/hollow_king.json?url';
import hollowKingPng from '../../assets/creatures_crown/hollow_king/hollow_king.png';
import hollowKing2Data from '../../assets/creatures_crown/hollow_king2/hollow_king2.json';
import hollowKing2Json from '../../assets/creatures_crown/hollow_king2/hollow_king2.json?url';
import hollowKing2Png from '../../assets/creatures_crown/hollow_king2/hollow_king2.png';
import bogToadData from '../../assets/creatures_swamp/bog_toad/bog_toad.json';
import bogToadJson from '../../assets/creatures_swamp/bog_toad/bog_toad.json?url';
import bogToadPng from '../../assets/creatures_swamp/bog_toad/bog_toad.png';
import mudlingData from '../../assets/creatures_swamp/mudling/mudling.json';
import mudlingJson from '../../assets/creatures_swamp/mudling/mudling.json?url';
import mudlingPng from '../../assets/creatures_swamp/mudling/mudling.png';
import lanternWispData from '../../assets/creatures_swamp/lantern_wisp/lantern_wisp.json';
import lanternWispJson from '../../assets/creatures_swamp/lantern_wisp/lantern_wisp.json?url';
import lanternWispPng from '../../assets/creatures_swamp/lantern_wisp/lantern_wisp.png';
import reedWitchData from '../../assets/creatures_swamp/reed_witch/reed_witch.json';
import reedWitchJson from '../../assets/creatures_swamp/reed_witch/reed_witch.json?url';
import reedWitchPng from '../../assets/creatures_swamp/reed_witch/reed_witch.png';
import bogsnapperData from '../../assets/creatures_swamp/bogsnapper/bogsnapper.json';
import bogsnapperJson from '../../assets/creatures_swamp/bogsnapper/bogsnapper.json?url';
import bogsnapperPng from '../../assets/creatures_swamp/bogsnapper/bogsnapper.png';
import motherMurkData from '../../assets/creatures_swamp/mother_murk/mother_murk.json';
import motherMurkJson from '../../assets/creatures_swamp/mother_murk/mother_murk.json?url';
import motherMurkPng from '../../assets/creatures_swamp/mother_murk/mother_murk.png';
import motherMurk2Data from '../../assets/creatures_swamp/mother_murk2/mother_murk2.json';
import motherMurk2Json from '../../assets/creatures_swamp/mother_murk2/mother_murk2.json?url';
import motherMurk2Png from '../../assets/creatures_swamp/mother_murk2/mother_murk2.png';
import snowGoatData from '../../assets/creatures_frost/snow_goat/snow_goat.json';
import snowGoatJson from '../../assets/creatures_frost/snow_goat/snow_goat.json?url';
import snowGoatPng from '../../assets/creatures_frost/snow_goat/snow_goat.png';
import cragGoblinData from '../../assets/creatures_frost/crag_goblin/crag_goblin.json';
import cragGoblinJson from '../../assets/creatures_frost/crag_goblin/crag_goblin.json?url';
import cragGoblinPng from '../../assets/creatures_frost/crag_goblin/crag_goblin.png';
import pebbleGolemData from '../../assets/creatures_frost/pebble_golem/pebble_golem.json';
import pebbleGolemJson from '../../assets/creatures_frost/pebble_golem/pebble_golem.json?url';
import pebbleGolemPng from '../../assets/creatures_frost/pebble_golem/pebble_golem.png';
import frostlingData from '../../assets/creatures_frost/frostling/frostling.json';
import frostlingJson from '../../assets/creatures_frost/frostling/frostling.json?url';
import frostlingPng from '../../assets/creatures_frost/frostling/frostling.png';
import oldBighornData from '../../assets/creatures_frost/old_bighorn/old_bighorn.json';
import oldBighornJson from '../../assets/creatures_frost/old_bighorn/old_bighorn.json?url';
import oldBighornPng from '../../assets/creatures_frost/old_bighorn/old_bighorn.png';
import frostbeardData from '../../assets/creatures_frost/frostbeard/frostbeard.json';
import frostbeardJson from '../../assets/creatures_frost/frostbeard/frostbeard.json?url';
import frostbeardPng from '../../assets/creatures_frost/frostbeard/frostbeard.png';
import frostbeard2Data from '../../assets/creatures_frost/frostbeard2/frostbeard2.json';
import frostbeard2Json from '../../assets/creatures_frost/frostbeard2/frostbeard2.json?url';
import frostbeard2Png from '../../assets/creatures_frost/frostbeard2/frostbeard2.png';
import outcastData from '../../assets/creatures_hub/city_outcast/city_outcast.json';
import outcastJson from '../../assets/creatures_hub/city_outcast/city_outcast.json?url';
import outcastPng from '../../assets/creatures_hub/city_outcast/city_outcast.png';
import glowcapData from '../../assets/dungeon_meadows/creatures/glowcap/glowcap.json';
import glowcapJson from '../../assets/dungeon_meadows/creatures/glowcap/glowcap.json?url';
import glowcapPng from '../../assets/dungeon_meadows/creatures/glowcap/glowcap.png';
import poacherData from '../../assets/creatures_kingswood/poacher/poacher.json';
import poacherJson from '../../assets/creatures_kingswood/poacher/poacher.json?url';
import poacherPng from '../../assets/creatures_kingswood/poacher/poacher.png';
import hedgeKnightData from '../../assets/creatures_kingswood/hedge_knight/hedge_knight.json';
import hedgeKnightJson from '../../assets/creatures_kingswood/hedge_knight/hedge_knight.json?url';
import hedgeKnightPng from '../../assets/creatures_kingswood/hedge_knight/hedge_knight.png';
import tuskerData from '../../assets/creatures_kingswood/tusker/tusker.json';
import tuskerJson from '../../assets/creatures_kingswood/tusker/tusker.json?url';
import tuskerPng from '../../assets/creatures_kingswood/tusker/tusker.png';
import outlawKingData from '../../assets/creatures_kingswood/outlaw_king/outlaw_king.json';
import outlawKingJson from '../../assets/creatures_kingswood/outlaw_king/outlaw_king.json?url';
import outlawKingPng from '../../assets/creatures_kingswood/outlaw_king/outlaw_king.png';
import outlawKing2Data from '../../assets/creatures_kingswood/outlaw_king2/outlaw_king2.json';
import outlawKing2Json from '../../assets/creatures_kingswood/outlaw_king2/outlaw_king2.json?url';
import outlawKing2Png from '../../assets/creatures_kingswood/outlaw_king2/outlaw_king2.png';
import rootGrubData from '../../assets/dungeon_meadows/creatures/root_grub/root_grub.json';
import rootGrubJson from '../../assets/dungeon_meadows/creatures/root_grub/root_grub.json?url';
import rootGrubPng from '../../assets/dungeon_meadows/creatures/root_grub/root_grub.png';
import moleMinerData from '../../assets/dungeon_meadows/creatures/mole_miner/mole_miner.json';
import moleMinerJson from '../../assets/dungeon_meadows/creatures/mole_miner/mole_miner.json?url';
import moleMinerPng from '../../assets/dungeon_meadows/creatures/mole_miner/mole_miner.png';
import oldDigbyData from '../../assets/dungeon_meadows/creatures/old_digby/old_digby.json';
import oldDigbyJson from '../../assets/dungeon_meadows/creatures/old_digby/old_digby.json?url';
import oldDigbyPng from '../../assets/dungeon_meadows/creatures/old_digby/old_digby.png';
import rootbeardData from '../../assets/dungeon_meadows/creatures/old_rootbeard/old_rootbeard.json';
import rootbeardJson from '../../assets/dungeon_meadows/creatures/old_rootbeard/old_rootbeard.json?url';
import rootbeardPng from '../../assets/dungeon_meadows/creatures/old_rootbeard/old_rootbeard.png';
import scarecrowData from '../../assets/harvest/scarecrow/scarecrow.json';
import scarecrowJson from '../../assets/harvest/scarecrow/scarecrow.json?url';
import scarecrowPng from '../../assets/harvest/scarecrow/scarecrow.png';
import queenBumbleData from '../../assets/harvest/queen_bumble/queen_bumble.json';
import queenBumbleJson from '../../assets/harvest/queen_bumble/queen_bumble.json?url';
import queenBumblePng from '../../assets/harvest/queen_bumble/queen_bumble.png';
import queenBumble2Data from '../../assets/harvest/queen_bumble2/queen_bumble2.json';
import queenBumble2Json from '../../assets/harvest/queen_bumble2/queen_bumble2.json?url';
import queenBumble2Png from '../../assets/harvest/queen_bumble2/queen_bumble2.png';
import { clipMs, ensureClips, msBefore, type ActionData } from './clips.ts';

export type FigureAction = 'stand' | 'move' | 'attack1' | 'hit1' | 'die1' | 'defend';

interface Atlas {
  key: string;
  png: string;
  json: string;
  actions: Record<string, ActionData>;
}

interface CreatureFiles extends Atlas {
  /** The files are 2x: 0.5 draws the creature at the Art Director's CSS size; the big ones are drawn at fewer pixels (0.8, 1). */
  scale: number;
  /** The frame of `attack1` on which the blow lands (1-based), from the NOTES. */
  blowFrame: number;
  /** A second atlas for the creature's second phase (King Goo under half HP): the clips it holds replace the first's. */
  phase2?: Atlas;
  /** True for a creature drawn in the air: its shadow is smaller. */
  hovers?: boolean;
}

const actionsOf = (data: unknown): Record<string, ActionData> => (data as { actions: Record<string, ActionData> }).actions;

/** By enemy id (`rules/data/enemies.json`). */
const CREATURES: Record<string, CreatureFiles> = {
  slime: { key: 'slime', png: slimePng, json: slimeJson, actions: actionsOf(slimeData), scale: 0.5, blowFrame: 7 },
  wolf: { key: 'sprout', png: sproutPng, json: sproutJson, actions: actionsOf(sproutData), scale: 0.5, blowFrame: 7 },
  bandit: { key: 'bandit', png: banditPng, json: banditJson, actions: actionsOf(banditData), scale: 0.5, blowFrame: 4 },
  wisp: { key: 'bee', png: beePng, json: beeJson, actions: actionsOf(beeData), scale: 0.5333, blowFrame: 7, hovers: true },
  'wolf-alpha': { key: 'muncher', png: muncherPng, json: muncherJson, actions: actionsOf(muncherData), scale: 0.7273, blowFrame: 5 },
  'thornwood-warden': {
    key: 'goo',
    png: gooPng,
    json: gooJson,
    actions: actionsOf(gooData),
    // A touch under the file's size, so there is room between him and the Knight (Robin, 2026-11-01: "you are almost hugging it").
    scale: 0.9,
    blowFrame: 5,
    phase2: { key: 'goo2', png: goo2Png, json: goo2Json, actions: actionsOf(goo2Data) },
  },
  // Wobblewood (Mitch, AD, 2026-11-01): the rules' ids are the first names.
  // The Buried Crown (Mitch, AD, 2026-11-02). The King at 1.12, not the atlas's 1.6, to stay in the column, like the other bosses.
  'crypt-guard': { key: 'crypt_guard', png: cryptGuardPng, json: cryptGuardJson, actions: actionsOf(cryptGuardData), scale: 0.6667, blowFrame: 4 },
  'gilded-wraith': { key: 'gilded_wraith', png: gildedWraithPng, json: gildedWraithJson, actions: actionsOf(gildedWraithData), scale: 0.5714, blowFrame: 7 },
  'stone-gargoyle': { key: 'stone_gargoyle', png: stoneGargoylePng, json: stoneGargoyleJson, actions: actionsOf(stoneGargoyleData), scale: 0.7273, blowFrame: 7 },
  'gold-mimic': { key: 'gold_mimic', png: goldMimicPng, json: goldMimicJson, actions: actionsOf(goldMimicData), scale: 0.6154, blowFrame: 7 },
  'last-steward': { key: 'last_steward', png: lastStewardPng, json: lastStewardJson, actions: actionsOf(lastStewardData), scale: 0.8, blowFrame: 4 },
  'hollow-king': { key: 'hollow_king', png: hollowKingPng, json: hollowKingJson, actions: actionsOf(hollowKingData), scale: 1.12, blowFrame: 5, phase2: { key: 'hollow_king2', png: hollowKing2Png, json: hollowKing2Json, actions: actionsOf(hollowKing2Data) } },
  // The Giants' Land (Mitch, AD, 2026-11-02). The King at 1.1, not the atlas's 1.3333, to stay in the column, like the other bosses.
  'young-yeti': { key: 'young_yeti', png: youngYetiPng, json: youngYetiJson, actions: actionsOf(youngYetiData), scale: 0.6667, blowFrame: 7 },
  'snow-monster': { key: 'snow_monster', png: snowMonsterPng, json: snowMonsterJson, actions: actionsOf(snowMonsterData), scale: 0.6667, blowFrame: 7 },
  'frost-ogre': { key: 'frost_ogre', png: frostOgrePng, json: frostOgreJson, actions: actionsOf(frostOgreData), scale: 0.6667, blowFrame: 4 },
  'icicle-bat': { key: 'icicle_bat', png: icicleBatPng, json: icicleBatJson, actions: actionsOf(icicleBatData), scale: 0.5, blowFrame: 7 },
  'old-snowshoulder': { key: 'old_snowshoulder', png: oldSnowshoulderPng, json: oldSnowshoulderJson, actions: actionsOf(oldSnowshoulderData), scale: 1, blowFrame: 7 },
  'yeti-king': { key: 'yeti_king', png: yetiKingPng, json: yetiKingJson, actions: actionsOf(yetiKingData), scale: 1.1, blowFrame: 5, phase2: { key: 'yeti_king2', png: yetiKing2Png, json: yetiKing2Json, actions: actionsOf(yetiKing2Data) } },
  // The Pirate Isles (Mitch, AD, 2026-11-02). The Captain at 1.1, not the atlas's 1.3333, to stay in the column, like the other bosses.
  'deck-hand': { key: 'deck_hand', png: deckHandPng, json: deckHandJson, actions: actionsOf(deckHandData), scale: 0.5, blowFrame: 4 },
  'buccaneer': { key: 'buccaneer', png: buccaneerPng, json: buccaneerJson, actions: actionsOf(buccaneerData), scale: 0.5714, blowFrame: 4 },
  'scuttle-crab': { key: 'scuttle_crab', png: scuttleCrabPng, json: scuttleCrabJson, actions: actionsOf(scuttleCrabData), scale: 0.6154, blowFrame: 7 },
  'cheeky-parrot': { key: 'cheeky_parrot', png: cheekyParrotPng, json: cheekyParrotJson, actions: actionsOf(cheekyParrotData), scale: 0.5, blowFrame: 7 },
  'first-mate-redwake': { key: 'first_mate_redwake', png: firstMatePng, json: firstMateJson, actions: actionsOf(firstMateData), scale: 0.8, blowFrame: 4 },
  'captain-saltjaw': { key: 'captain_saltjaw', png: saltjawPng, json: saltjawJson, actions: actionsOf(saltjawData), scale: 1.1, blowFrame: 5, phase2: { key: 'captain_saltjaw2', png: saltjaw2Png, json: saltjaw2Json, actions: actionsOf(saltjaw2Data) } },
  // Bogglemire and The Frostcrown (Mitch, AD, 2026-11-02). The bosses at 1.1, not the atlas's 1.3333, to stay in the column.
  'bog-toad': { key: 'bog_toad', png: bogToadPng, json: bogToadJson, actions: actionsOf(bogToadData), scale: 0.5714, blowFrame: 7 },
  'mudling': { key: 'mudling', png: mudlingPng, json: mudlingJson, actions: actionsOf(mudlingData), scale: 0.6667, blowFrame: 7 },
  'lantern-wisp': { key: 'lantern_wisp', png: lanternWispPng, json: lanternWispJson, actions: actionsOf(lanternWispData), scale: 0.5714, blowFrame: 7 },
  'reed-witch': { key: 'reed_witch', png: reedWitchPng, json: reedWitchJson, actions: actionsOf(reedWitchData), scale: 0.5714, blowFrame: 4 },
  'bogsnapper': { key: 'bogsnapper', png: bogsnapperPng, json: bogsnapperJson, actions: actionsOf(bogsnapperData), scale: 1.1429, blowFrame: 7 },
  'mother-murk': { key: 'mother_murk', png: motherMurkPng, json: motherMurkJson, actions: actionsOf(motherMurkData), scale: 1.1, blowFrame: 5, phase2: { key: 'mother_murk2', png: motherMurk2Png, json: motherMurk2Json, actions: actionsOf(motherMurk2Data) } },
  'snow-goat': { key: 'snow_goat', png: snowGoatPng, json: snowGoatJson, actions: actionsOf(snowGoatData), scale: 0.7273, blowFrame: 7 },
  'crag-goblin': { key: 'crag_goblin', png: cragGoblinPng, json: cragGoblinJson, actions: actionsOf(cragGoblinData), scale: 0.5333, blowFrame: 4 },
  'pebble-golem': { key: 'pebble_golem', png: pebbleGolemPng, json: pebbleGolemJson, actions: actionsOf(pebbleGolemData), scale: 0.8, blowFrame: 7 },
  'frostling': { key: 'frostling', png: frostlingPng, json: frostlingJson, actions: actionsOf(frostlingData), scale: 0.5, blowFrame: 7 },
  'old-bighorn': { key: 'old_bighorn', png: oldBighornPng, json: oldBighornJson, actions: actionsOf(oldBighornData), scale: 1, blowFrame: 7 },
  'frostbeard': { key: 'frostbeard', png: frostbeardPng, json: frostbeardJson, actions: actionsOf(frostbeardData), scale: 1.1, blowFrame: 5, phase2: { key: 'frostbeard2', png: frostbeard2Png, json: frostbeard2Json, actions: actionsOf(frostbeard2Data) } },
  // The Kingswood (Mitch, AD, 2026-11-02).
  'city-outcast': { key: 'city_outcast', png: outcastPng, json: outcastJson, actions: actionsOf(outcastData), scale: 0.5, blowFrame: 4 },
  // Its own folk (Mitch, AD, 2026-11-03). The King at 1.12, not the atlas's 1.6, to stay in the column, like the Hollow King.
  poacher: { key: 'poacher', png: poacherPng, json: poacherJson, actions: actionsOf(poacherData), scale: 0.5333, blowFrame: 4 },
  'hedge-knight': { key: 'hedge_knight', png: hedgeKnightPng, json: hedgeKnightJson, actions: actionsOf(hedgeKnightData), scale: 0.5714, blowFrame: 4 },
  tusker: { key: 'tusker', png: tuskerPng, json: tuskerJson, actions: actionsOf(tuskerData), scale: 0.6667, blowFrame: 7 },
  'outlaw-king': { key: 'outlaw_king', png: outlawKingPng, json: outlawKingJson, actions: actionsOf(outlawKingData), scale: 1.12, blowFrame: 4, phase2: { key: 'outlaw_king2', png: outlawKing2Png, json: outlawKing2Json, actions: actionsOf(outlawKing2Data) } },
  // The Rootways (Mitch, AD, 2026-11-02). Old Rootbeard at his number, not the atlas's, which runs past the column.
  'glowcap': { key: 'glowcap', png: glowcapPng, json: glowcapJson, actions: actionsOf(glowcapData), scale: 0.5714, blowFrame: 7 },
  // More of them (Mitch, AD, 2026-11-03). Old Digby a touch under his atlas's 1.1429, smaller than Old Rootbeard.
  'root-grub': { key: 'root_grub', png: rootGrubPng, json: rootGrubJson, actions: actionsOf(rootGrubData), scale: 0.5, blowFrame: 7 },
  'mole-miner': { key: 'mole_miner', png: moleMinerPng, json: moleMinerJson, actions: actionsOf(moleMinerData), scale: 0.6667, blowFrame: 7 },
  'old-digby': { key: 'old_digby', png: oldDigbyPng, json: oldDigbyJson, actions: actionsOf(oldDigbyData), scale: 1.05, blowFrame: 7 },
  'old-rootbeard': { key: 'old_rootbeard', png: rootbeardPng, json: rootbeardJson, actions: actionsOf(rootbeardData), scale: 1.2, blowFrame: 5 },
  'spider': { key: 'twigling', png: twiglingPng, json: twiglingJson, actions: actionsOf(twiglingData), scale: 0.5, blowFrame: 7 },
  'treant': { key: 'moss_goblin', png: mossGoblinPng, json: mossGoblinJson, actions: actionsOf(mossGoblinData), scale: 0.5, blowFrame: 4 },
  'outlaw': { key: 'sporeling', png: sporelingPng, json: sporelingJson, actions: actionsOf(sporelingData), scale: 0.5, blowFrame: 7 },
  'wraith': { key: 'nutkin', png: nutkinPng, json: nutkinJson, actions: actionsOf(nutkinData), scale: 0.5, blowFrame: 7 },
  'spider-queen': { key: 'owlbear', png: owlbearPng, json: owlbearJson, actions: actionsOf(owlbearData), scale: 0.7273, blowFrame: 5 },
  'briar-king': {
    key: 'grumblebark',
    png: grumblebarkPng,
    json: grumblebarkJson,
    actions: actionsOf(grumblebarkData),
    // Under the file's 1.1429, as with King Goo, so his body stops short of the hero (Robin, 2026-11-01: "you are almost hugging it").
    scale: 0.92,
    blowFrame: 5,
    phase2: { key: 'grumblebark2', png: grumblebark2Png, json: grumblebark2Json, actions: actionsOf(grumblebark2Data) },
  },
  // Honeyhill Fields (Mitch, AD, 2026-11-02): the rules' ids are the first names.
  'ice-wolf': { key: 'honey_blob', png: honeyBlobPng, json: honeyBlobJson, actions: actionsOf(honeyBlobData), scale: 0.6154, blowFrame: 7 },
  'yeti': { key: 'corn_goblin', png: cornGoblinPng, json: cornGoblinJson, actions: actionsOf(cornGoblinData), scale: 0.5, blowFrame: 4 },
  'frost-wisp': { key: 'buzzbug', png: buzzbugPng, json: buzzbugJson, actions: actionsOf(buzzbugData), scale: 0.5, blowFrame: 7, hovers: true },
  'ice-golem': { key: 'apple_mimic', png: appleMimicPng, json: appleMimicJson, actions: actionsOf(appleMimicData), scale: 0.5, blowFrame: 7 },
  'yeti-elder': { key: 'scarecrow', png: scarecrowPng, json: scarecrowJson, actions: actionsOf(scarecrowData), scale: 0.7273, blowFrame: 4 },
  'frost-matriarch': {
    key: 'queen_bumble',
    png: queenBumblePng,
    json: queenBumbleJson,
    actions: actionsOf(queenBumbleData),
    // Under the file's 1.3333, so she stays clear of the title and the column's edge, and sharper on a phone (mine).
    scale: 1.05,
    blowFrame: 5,
    hovers: true,
    phase2: { key: 'queen_bumble2', png: queenBumble2Png, json: queenBumble2Json, actions: actionsOf(queenBumble2Data) },
  },
};

// Each land's world boss (Robin, 2026-11-04: one per land) wears the look of the creature it is the great one of, bigger,
// until Mitch, AD draws its own (mine).
const STAND_INS: Record<string, [string, number]> = {
  bristleback: ['tusker', 0.9],
  'mother-owlbear': ['spider-queen', 0.95],
  bramley: ['ice-golem', 0.85],
  'grandfather-croak': ['bog-toad', 1],
  cragheart: ['pebble-golem', 1.1],
  clackclaw: ['scuttle-crab', 0.9],
  frostgut: ['frost-ogre', 1],
};
for (const [id, [as, scale]] of Object.entries(STAND_INS)) if (!CREATURES[id] && CREATURES[as]) CREATURES[id] = { ...CREATURES[as]!, scale };

/** The creature whose sounds this one uses: a world boss's stand-in lends its voice too, until it has its own. */
export function voiceOf(enemyId: string): string {
  return STAND_INS[enemyId]?.[0] ?? enemyId;
}

/** Queue one creature's atlas; the fight's preload calls it, so only what you meet costs memory (chapter 2, step 1). */
export function preloadCreature(scene: Phaser.Scene, enemyId: string): void {
  const c = CREATURES[enemyId];
  if (!c) return;
  if (!scene.textures.exists(c.key)) scene.load.atlas(c.key, c.png, c.json);
  if (c.phase2 && !scene.textures.exists(c.phase2.key)) scene.load.atlas(c.phase2.key, c.phase2.png, c.phase2.json);
}

/** Let go of every creature's atlas and clips but these: walking into another area frees the last one's. */
export function releaseCreatures(game: Phaser.Game, keep: readonly string[]): void {
  const kept = new Set(keep);
  // An atlas worn by two (a world boss's stand-in) stays while either is kept.
  const keptKeys = new Set([...kept].flatMap((id) => (CREATURES[id] ? [CREATURES[id]!.key, ...(CREATURES[id]!.phase2 ? [CREATURES[id]!.phase2!.key] : [])] : [])));
  for (const [id, c] of Object.entries(CREATURES)) {
    if (kept.has(id)) continue;
    for (const atlas of c.phase2 ? [c, c.phase2] : [c]) {
      if (keptKeys.has(atlas.key) || !game.textures.exists(atlas.key)) continue;
      for (const action of Object.keys(atlas.actions)) game.anims.remove(`${atlas.key}/${action}`);
      game.textures.remove(atlas.key);
    }
  }
}

export function creatureReady(scene: Phaser.Scene, enemyId: string): boolean {
  const c = CREATURES[enemyId];
  return !!c && scene.textures.exists(c.key);
}

/** A figure that plays an atlas's clips. The sprite's x, y is where the feet stand. */
export class Figure {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly files: CreatureFiles;
  private fade: Phaser.Tweens.Tween | null = null;
  private phase = 1;
  private current: FigureAction = 'stand';

  constructor(scene: Phaser.Scene, enemyId: string, x: number, y: number) {
    this.scene = scene;
    this.files = CREATURES[enemyId]!;
    ensureClips(scene, this.files.key, this.files.actions);
    if (this.files.phase2) ensureClips(scene, this.files.phase2.key, this.files.phase2.actions);
    const first = this.files.actions.stand?.frames[0]?.name;
    this.sprite = scene.add.sprite(x, y, this.files.key, first).setScale(this.files.scale);
    this.sprite.play(`${this.files.key}/stand`);
  }

  /** Files face left; true turns the figure to face right. */
  face(right: boolean): void {
    this.sprite.setFlipX(right);
  }

  /** The atlas a clip comes from: the second phase's where it has the clip, else the first's. */
  private atlasFor(action: string): Atlas {
    const p2 = this.files.phase2;
    return this.phase === 2 && p2 && p2.actions[action] ? p2 : this.files;
  }

  /** The creature's second phase (a boss under half HP): its angrier clips, where it has them. */
  setPhase(phase: number): void {
    if (phase === this.phase) return;
    this.phase = phase;
    this.play(this.current);
  }

  /** How far into `attack1` the blow lands, in ms: the hit's flash waits for it. */
  blowMs(): number {
    const a = this.atlasFor('attack1').actions.attack1;
    return a ? msBefore(a, this.files.blowFrame) : 0;
  }

  /** The contact shadow under the figure: its width and where its centre sits against the feet (a big body set forward of its pivot). */
  shadow(): { width: number; dx: number } {
    const f = this.files.actions.stand?.frames[0];
    if (!f?.lt || !f.rb) return { width: 96, dx: 0 };
    const width = (f.rb.x - f.lt.x) * this.files.scale * (this.files.hovers ? 0.5 : 0.8);
    return { width, dx: ((f.rb.x + f.lt.x) / 2) * this.files.scale };
  }

  /** The height of the standing figure's top above its feet, in CSS px, for a bar or a marker over it. */
  headHeight(): number {
    const head = this.files.actions.stand?.frames[0]?.head;
    return head ? -head.y * this.files.scale : 60;
  }

  /** Play a clip; a one-shot clip goes back to `stand` when it ends unless `hold` is set. */
  play(action: FigureAction, hold = false): void {
    this.current = action;
    const atlas = this.atlasFor(action);
    const key = `${atlas.key}/${action}`;
    if (!this.scene.anims.exists(key)) return;
    this.fade?.stop();
    this.fade = null;
    this.sprite.setAlpha(1);
    this.sprite.off('animationcomplete');
    this.sprite.play(key, false);
    if (action === 'die1') {
      // The last frames fade (a0, a1 in the actions block): a tween over their time; the figure stays down.
      const a = this.files.actions.die1;
      const frames = a?.frames ?? [];
      const fading = frames.filter((f) => f.a1 !== undefined && f.a1 < (f.a0 ?? 255)).length || 2;
      const before = a ? clipMs(a) - frames.slice(-fading).reduce((n, f) => n + f.delay, 0) : 0;
      const last = frames.slice(-fading).reduce((n, f) => n + f.delay, 0);
      this.fade = this.scene.tweens.add({ targets: this.sprite, alpha: 0, delay: before, duration: Math.max(1, last) });
      return;
    }
    if (!hold && action !== 'stand' && action !== 'move') {
      this.sprite.once('animationcomplete', () => {
        if (this.sprite.active) this.play('stand');
      });
    }
  }
}
