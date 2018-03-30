var Scene = require('Scene');
var Diagnostics = require('Diagnostics');
var TouchGestures = require("TouchGestures");
var Time = require('Time')
var FaceTracking = require('FaceTracking');
var Animation = require('Animation');
var Reactive = require('Reactive')

// main scene objects
var sceneRoot = Scene.root.child("Device").child("Camera").child("Focal Distance")
var scoreText = sceneRoot.child("2DCanvas0").child("text0")
var bonusObject = sceneRoot.child("bonus")
var ft = Scene.root.child("Device").child("Camera").child("Focal Distance").child("facetracker0");
var mouthIsOpen = FaceTracking.face(0).mouth.openness.gt(0.3).and(FaceTracking.count.gt(0));
var mouthCenter = FaceTracking.face(0).mouth.center;
var sparkle = bonusObject.child("sparkle")
var egg = bonusObject.child("egg")
var character0 = sceneRoot.child("character0")
var character1 = sceneRoot.child("character1")
var character2 = sceneRoot.child("character2")
var character3 = sceneRoot.child("character3")
var characters = [
    { element: character0 },
    { element: character1 },
    { element: character2 },
    { element: character3 }
]

var score = 0
var numTargets = 4
var hideTime = 1500
var bonusTime = 8000
var bonusAnimationTime = 4000

var randomInterval = function (character) {
    var randomTime = Math.floor(Math.random() * 3000) + 1000 // 1000 - 4000
    var elementName = character.element.name

    character.randomTimeId = Time.setTimeout(function () {
        toggleElement(character, false)
        timeToHide(character)
    }, randomTime)
}

var timeToHide = function (character) {
    character.timeToHideId = Time.setTimeout(function () {
        // character.element.hidden = true
        toggleElement(character, true)
        randomInterval(character)
    }, hideTime)
}

var bonusTimer = function (bonus) {
    Time.setTimeout(function () {
        bonus.hidden
        moveBonus(bonus)
        bonusTimer(bonus)
    }, bonusTime)
}

// subscribes a tap event for a target
var tapRegistrar = function (character) {
    TouchGestures.onTap(character.element).subscribe(function (event) {
        updateScore(5)
        toggleElement(character, true)
        Time.clearTimeout(character.timeToHideId)
        randomInterval(character)
    })
}

// hides/shows element
var toggleElement = function (character, hide) {
    if (character.element.name.slice(character.element.name.length - 1) < 2) showRight(character.element, hide)
    else if (character.element.name.slice(character.element.name.length - 1) > 1) showLeft(character.element, hide)

    if (character.element.hidden) character.element.hidden = false
}

var updateScore = function (amount) {
    score += amount
    scoreText.text = "score: " + score.toString()
}

var showRight = function (character, hide) { moveCharacter(character, hide ? 10 : 27, hide ? 27 : 10) }
var showLeft = function (character, hide) { moveCharacter(character, hide ? -10 : -27, hide ? -27 : -10) }

var moveCharacter = function (character, startX, endX) {
    var driver = Animation.timeDriver({
        durationMilliseconds: 500,
        loopCount: 1, // can be Infinity
        mirror: true
    })

    var sampler = Animation.samplers.easeInOutBack(startX, endX);
    character.transform.x = Animation.animate(driver, sampler);
    driver.start();
}

var moveBonus = function (bonus) {
    var driver = Animation.timeDriver({
        durationMilliseconds: bonusAnimationTime,
        loopCount: 1, // can be Infinity
        mirror: true
    })

    var sampler = Animation.samplers.linear(27, -40);
    bonus.transform.y = Animation.animate(driver, sampler);
    bonus.hidden = false
    egg.hidden = false
    sparkle.hidden = true
    driver.start();
}

var test = mouthIsOpen.monitor().subscribe(function (e) {
    var mouthX, mouthY
    if (e.newValue == true) {

        var mouthX = mouthCenter.x.lastValue
        var mouthY = mouthCenter.y.lastValue
        var eggY = bonusObject.transform.y.lastValue
        var maxYdistance = 15
        // Diagnostics.log(Math.abs(mouthY - eggY))

        if (Math.abs(mouthY - eggY) < maxYdistance) {
            updateScore(50)
            egg.hidden = true
            sparkle.hidden = false
            Time.setTimeout(function () {
                sparkle.hidden = true
            }, 1500)
        }
    } else {
        // e.unsubscribe()
    }
})

// initialize game
var run = function () {
    scoreText.text = "score: " + score.toString()

    characters.forEach(function (character) {
        tapRegistrar(character)
        randomInterval(character)
    })

    bonusTimer(bonusObject)
}

// start the game
run()
