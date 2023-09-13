Features:
+ first need to create the pieces
+ first we want to place a piece
+ then move a piece
+ create pieces rotation (it's not a simple pi/2 rotate)
+ click to pause
+ let's make things as much expressive as we can (kinda)
+ clear a line
+ FPS compute (can help optimise)
+ turn pieces instead of have them in the correct postion initially
+ check box to soft drop on levels < 14 (in settings)
+ deal with speed
+ add a slider to choose replay speed
+ import game from URL (very minified so that in can be a QR)
+ add sounds, could be cute
+ show drought counter
+ take into account the start level in levelUp
+ add stats : Drought
+ have a replay button (click on the field, it will)
+ display the end screen
+ zoom level (auto and manual) just put a % slider for #field width
+ show next piece
+ host that on github
+ Size correctly on iPhone
+ save games (in localStorage), record date/time
+ As this is a client only app, have an import/export function
+ Save game stats at the end of the run
+ Display a overview of all the games recorded in the localStorage
+ Deal with local timezones
+ Sort games by lines/score/date/tag
Blink screen on Tetris 
Expedite playback
Manage name so that it can be shared and imported
have all this settings an a NES style interface
add stats : Tetris Rate
compute and show game time
menu selection beep
show the game at a certain : frame/percentage/time, thanks to a URL parameter
Tag games of special interst
allow comments on the games (use something like disqus or alternatives : yt/K0WJRApcKCA)
can publish a game 
stats and other stuff to analyze:
- t parity correlation, on best games (mine, bot)
- highest drill down
- best 4 lines sequences
- rate of good games (aGameScout)
- highest tetris
- latest tetris (by line, by score)
- longest drought (I shortage), longest survived
- Biggest scattered stack drillage 
- RNG kindness 
- T spins
mine some XRM, and take half of the profit ! (the other half can go to the replay owner, put it in a stash in the meantime)
retire
make it pixel perfect
Have a zooming option
add comments to the game, that can be displayed in real time
have a owner status in the comments
List caveats :
- can't reproduce exact piece movements done by the player, they're synthetized by the replay engine
- limit on replay size : max pieces


Issues to fix:
+ the start of the game is trash
+ a piece goes up at the beginning
+ placement is incorrect on piece 4 for game
+ fix the color change bug (happens at 48 instead of 50)
+ finish cleanly (looping on error because no more "event"s)
+ level display is very wrong (it was a str and not an int)
+ score is very broken, considering levels (game ending with 50l with St Basil launch)
+ replay speed is not showing the right factor (always x1)
+ color change is not happening when starting on another level than 0
+ tidy the divs 
+ the next piece doesn't appear on first piece
+ very long breaks are happening, unclear when and why
+ fix the speed issue
+ slow down the clear line animation
+ Sometimes some junk is placed on the right of the screen at the end of the replay
+ Sharing by iMessage doesn't work on long urls, it truncates the URL at some point
+ Correct the level formula, it is wrong about 100 or so...
Make the next piece match the original (what does it mean?)
Stop these transparent pieces, and deal with pathfinding (hard!).
> Turns out, there is a smarter way (where was the piece on the row above ? position / slide +/- 1) also consider low lever multi tuck
interrupt sound playing to avoid piling in fast replays, delays
On same topic there is a discrepancy between Chrome & Safari
Fix this weird unreachable round 60 FPS (who cares ?)
Speed seems funky on levels below 13
*/

/* Test games
With 2 tetris:
?sl=14&r=eckksZlCEXlAYxKLUiB4KN4me4Gsh7zapXAFaHbAUqmUUgJ3qmUUkNHvRgzSxDvMkQAAAA=


http://127.0.0.1:3000/index.html?sl=14&r=eckksZlCEXlAYxKLUiB4KN4me4Gsh7zapXAFaHbAUqmUUgJ3qmUUkNHvRgzSxDvMkQAAAA



Single tuck
?sl=18&r=OQVks3qJrSUkkBMxkglWmQjFEEA

Multipe tuck
?sl=0&r=iTJeppHlqoWGUKgyWg12qWcmWNkRYj1CoAAAAA=

T-spin
?sl=18&r=mShkppwiCghGHJOZVkhIKRyRiEWqJ4lWtkmYzGG1UqUIgAA

Stuck piece at the end
?sl=0&r=CQTjJYIaDDkpHMVgVSpDsUplEEA

This very long game has a false score (239020):
https://trochr.github.io/Nes-Tetris-Replay/?sl=18&r=OYBksYuWSGkxYKiUWgwXqKDEeV3IFxUa0mgZoJlEXqiMRaoVvJ7CY1HDd5lelFqVqVW+ZRNq1ayIKJiZg8WqRhnel2jlz2cEnJVgVUwIRRoxfE1pl6gdEWshyiWmXRJSQWaGqdxUY2GnhkmW4WmlpBa42od0ga1nSdpxcxXjh5zeIXKN4GhEXKWBjeyIEFijax3JJ8WaEVnFLJlFHsNoZg93pWBpg8HxV8CahGtd5la2HHNw5coHRRqUWsXJFgXcRnGhzXYSWvBsScxHgVzIa12KRiVUwXmJyjfEmqVSYapGjl8TYFFJdioY00hBxicMHJlzwaF3PJz5cpXgd0UcuXEB4Uc4njFqocYWMdiRUxoRdyVjJYgR6meMIRdoiagGBVqiYxFoZbZjEWimETcgWqV5hWp3tl8TceIReC1gJHpKLHlIonmIziVIQCIRelHEaLQfGIhNxkWqXxV7DS14GZ6GaqHmGAZcoYHF8FaNFpFpJYo1Bd70WNoMCEXelnBKDxeiYPGBzcsXKWCYe1XBFrHlF5POCAhGIDBkUegXNNqiYVnimUVlCIxJw1goWJRyhUlGEeA2cpmnZgJaoGxdrFYlVJNpplGYxKDBgqIiF6lemYKSMTgN5RGQDg15MF6liF4HKEUemZRR6zcsXqFwHiWYRiCnhKXqaAighICCMXiRJJKSjklpRCISghYDJ5zapHJNjJkqJECAXiYXCJiWhEGNVooeeZRiSlkWIqaBIeoHxR7FahmsVamWwYpmUSkwZRViRcRVJOAycmYvmCkWwXGFbSU2Xxh5JWplGRDWPEjpUglEgAAAAA=

In reality it's 239160
This is due to wrong level change (should go to 19 instead of 18)

Another potentially wrong level change:
?sl=14&r=/KchkVpyGCGlBIrKDFgcXKiUQY1HKJr3elnBJRFdFljVIUYpFEU7ASEDsNJjMmZRJb4gqZRiSpk+HyiLokUoLaBJgqHuCERelXkOAUi+IqGRhi6IKOCBeRZMBxlgwnRR5neBWsNxgW2ZRN6AZEXJeLDa9XnV0BYZWKd7Ia+ZRV7AawnMmUUi+YqR55epoNJ6keVXMeUQkEopeT0iaJNGIhgV4wN6GhBXlmURkkIhaKnkx4HB7DiEnpV5HcomrhwRYtmNhjEdEGJVr3aZWQBaVUomsdbUS01qmUQcGZRaJojE/HsBrGe5XFVg4aRFBOBHYqYxKCWa0niVaXawnANhgalUqlrwaEmxFgzY8FBhqlWcEMhaphE3FhqjYhmqmEZgNoyKIxgt5SOSWmV5MOQQjFojKChc1IJeDHcxXMBpjek2kFShQqZRFSkg9oDmT4iQpRSCiel4xWKYfFXpFanaYUqJoUcE1tZhJlFHsdwwW1GslyidFXMNxncyZRGDyglXqeDDc4WqBbSYklKRhGhEknVoYchVjdrZc81sZxgYGZRiTwbEExJ44eR2NFqVe1HDVrDY80qVbJa8WRZQ5WQDshSkZ/GWKd0QUwmkVqTbGVqJQZSpGmVimawWCRsHaY2IZ0QY0mAFSZlFXrmMYiRoKeMTixnqZxwgmYvB8UiM4KJ7oiFIviJxgiYKJ6JcoHJFjFi83DeEYYxXERpmlEnsNzBal4NNRGckVxRrGYlVmhzESmVqJJnSiENY41KkzKMiTF

Some speed inaccuracies are demonstrated in this:
https://trochr.github.io/Nes-Tetris-Replay/?sl=18&r=GYEmV5wCKSilpSB4ViUGsaB2cqIPBbCelHGhqnY4mhmUYcpXrZqmYcnsZSplGIPCEXa05MZihiEnoN7BahGjlzxaoVkJ0XcdHOViiYyZRJrHgBnJmDwhEXmmMUkFYoWB3iw4mCISgkXiSDHgqYxVyGcw2rFqQaaJRaDDeiYjWEQe13oN7CcqHsR6JfEXld6kecXIN0BbB3KFalalVrRSTWNEJiURcUGMJSphF4RJCjYZmpZYUVBEKhxoa91KlsYWZVJNKnSkGRRYWUUVjBQTUqWRBbHaBWOhiCdGGsZqjc8WpR0YawGpZxzcZnKBqYaw2uRjHc8nIl0Wc1GshqjaNVoFgXWg1BlSnSqUKVLwUkkvNCVPFhrQqmDFRKA
Compared to the Video shot on the device: IMG_8974.MOV

Any spin
To get : game showing every single spin

Any tuck
To get : game showing every tuck


Massive replay (31 games):
http://127.0.0.1:3000/tests/fillScreen.html

...

