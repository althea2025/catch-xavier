// All difficulty balancing lives here. Distances are world px (32 px ≈ 1 m),
// visionAngle is the HALF angle in radians; hugWindow is the usable radius in px.
const shared={
  suspiciousVisionScale:1.16,suspiciousAngleScale:1.22,exposureRecovery:2.5,
  intuitionWarning:.45,intuitionTurn:1.65,intuitionCatch:2.05,intuitionRecovery:.9,
  intuitionOuterPressure:.4,nearIntuitionScale:1.2,nearIntuitionRadius:49,contactRadius:19,
  hugMinDistance:16,hugRearAngle:2.05,magicCooldown:18,magicRange:310,
  magicMemory:50,patternTierTwo:1.7,patternTierThree:3,patternDurations:[1,.74,.55],patternPenalty:.2,minDistractionDuration:2.2,
  investigationSpeed:62,investigationPause:.4,inspectionRadii:[50,75,100,130],
  quietInterruptRadius:119,occlusionAttenuation:.62,
  glanceTelegraph:.75,glanceSweep:1.15,doubleCheckTelegraph:.65,doubleCheckSweep:1.2,
  turnSpeed:2.3,calmTurnSpeed:1.6,investigationTurnSpeed:3.8,
  activitySpeed:52,suspiciousSpeed:64,activityDwell:[.8,1.3],
  falseRelaxationDuration:0,falseRelaxationSensitivity:1.12,
  suspiciousLookScale:.55,noticeCooldown:2,secretProbability:.09,
};
const profiles={
 RELAXED:{label:'悠閒',title:'RELAXED',icon:'🌿',description:'適合第一次遊玩與輕鬆體驗。',visionRange:220,visionAngle:.60,visualReactionTime:.72,hearingSensitivity:.8,footstepSensitivity:{sneak:.55,walk:.75,sprint:1},closeRangeRadius:85,closeRangeIntuitionRate:{sneak:.55,walk:1.1,sprint:2.2},suspiciousDuration:10,curiousDuration:5,distractedDuration:8,distractionInvestigationDistance:220,distractionEffectiveness:.68,investigationDwell:2.8,randomLookFrequency:[10,17],doubleCheckProbability:0,patternAwarenessRate:1,hugWindow:52,soCloseRange:108,activityVariation:.3},
 CANON:{label:'標準',title:'CANON',icon:'🌙',description:'推薦。最接近原故事中的警覺程度。',visionRange:245,visionAngle:.66,visualReactionTime:.52,hearingSensitivity:1,footstepSensitivity:{sneak:.85,walk:1,sprint:1},closeRangeRadius:112,closeRangeIntuitionRate:{sneak:1.75,walk:2.3,sprint:3.2},suspiciousDuration:13,curiousDuration:7,distractedDuration:6.5,distractionInvestigationDistance:185,distractionEffectiveness:.65,investigationDwell:2.5,randomLookFrequency:[7,13],doubleCheckProbability:0,patternAwarenessRate:1,hugWindow:47,soCloseRange:96,activityVariation:.38},
 COMMANDER:{label:'統帥',title:'COMMANDER',icon:'⚔️',description:'他可不是那麼容易被偷襲的人。',visionRange:270,visionAngle:.71,visualReactionTime:.43,hearingSensitivity:1.12,footstepSensitivity:{sneak:.9,walk:1.15,sprint:1.18},closeRangeRadius:124,closeRangeIntuitionRate:{sneak:2.1,walk:2.7,sprint:3.6},suspiciousDuration:16,curiousDuration:8,distractedDuration:5.6,distractionInvestigationDistance:165,distractionEffectiveness:.58,investigationDwell:2,randomLookFrequency:[5,9],doubleCheckProbability:.5,patternAwarenessRate:1.35,hugWindow:45,soCloseRange:96,activityVariation:.55,falseRelaxationDuration:5.5},
 XAVIER:{label:'挑戰',title:'XAVIER',icon:'◆',description:'……妳確定？高難度重玩挑戰。',visionRange:285,visionAngle:.74,visualReactionTime:.36,hearingSensitivity:1.22,footstepSensitivity:{sneak:1,walk:1.25,sprint:1.3},closeRangeRadius:132,closeRangeIntuitionRate:{sneak:2.4,walk:3,sprint:4},suspiciousDuration:18,curiousDuration:9,distractedDuration:4.8,distractionInvestigationDistance:145,distractionEffectiveness:.52,investigationDwell:1.65,randomLookFrequency:[4,7],doubleCheckProbability:.75,patternAwarenessRate:1.7,hugWindow:43,soCloseRange:92,activityVariation:.72,falseRelaxationDuration:7},
};
const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
export const DIFFICULTIES=freeze(Object.fromEntries(Object.entries(profiles).map(([id,p])=>[id,{...shared,...p,id}])));
export const difficultyProfile=id=>DIFFICULTIES[id]||DIFFICULTIES.CANON;
