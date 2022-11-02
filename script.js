var colors=[[[32,56,236],  [59,188,252]]  // 0
           ,[[0,168,0],    [128,208,16]]  // 1
           ,[[188,0,188],  [244,120,252]] // 2
           ,[[32,56,236],  [76,220,72]]   // 3
           ,[[252,0,88],   [0,255,146]]   // 4
            ,[[88,248,152], [92,148,252]]  // 5
            ,[[216,40,0],   [116,116,116]] // 6
            ,[[128,0,240],  [168,0,16]]    // 7
            ,[[32,56,236],  [216,40,0]]    // 8
            ,[[216,40,0],   [252,152,56]]] // 9

var shapesRotation = {T:["Td","Tl","Tu","Tr"], 
                      J:["Jd","Jl","Ju","Jr"], 
                      L:["Ld","Ll","Lu","Lr"],
                      S:["Sh","Sv"],
                      Z:["Zh","Zv"],
                      I:["Ih","Iv"],
                      O:["On"]}

window.onload = function() {
    window.game = {paused:false,piecesCount :0,score:0
                ,lines:0,level:0};
    window.game.level = 0;
    window.gamePaused = false;
    buildShapes()
    document.querySelector("#main").onclick = togglePauseGameReplay;
    document.querySelector("#speedSlider").oninput = changeSpeed;
    slashSplitURL() // fixes issue in iOS URL detection by inserting slashes
    tetrisGame(getSequenceFromUrl())
    if (localStorage.getItem("ntr")  == undefined ) {
        initLocalStorage()
    }

    saveGame()
}

function unSlashSplitURL() {
    let url = new URL(window.location)
    let params = new URLSearchParams(url.search);
    let r=params.get("r").replaceAll(" ","+"); 
    // clean the slashes added for iOS sharing purpose
    r=r.replaceAll("//","_")
    r=r.replaceAll("/","")
    r=r.replaceAll("_","/")
    params.set("r",r)
    url.search = decodeURIComponent(params)
    return url.toString()
}


function slashSplitURL() {
    // Adding slashes to allow iOS sharing

    let params = new URLSearchParams(window.location.search);
    let r=params.get("r"); // "foo"
    if (r[0] != "/") { // only do the processing once
        r=r.replaceAll("/","//")
        r=r.replaceAll("=","")
        r="/"+r
        r=r.match(/.{1,300}/g)
        r=r.join("/")
        params.set("r",r)
        window.location.search = decodeURIComponent(params)    
    }
    return
}

function initLocalStorage () {
    localStorage.setItem("ntr",12)
}
  
async function sha256(text) {

    async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode comme (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // fait le condensé
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convertit le buffer en tableau d'octet
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convertit le tableau en chaîne hexadélimale
    return hashHex;
    }

    const digestHex = await digestMessage(text);
    return digestHex;
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2);
  }
function getSequenceFromUrl() {
    let params = new URLSearchParams(window.location.search);
    let r=params.get("r").replaceAll(" ","+"); 
    // clean the slashes added for iOS sharing purpose
    r=r.replaceAll("//","_")
    r=r.replaceAll("/","")
    r=r.replaceAll("_","/")
    startLevel=params.get("sl")
    decoded=atob(r)
    decodedBytes=[]
    for (var i=0; i<decoded.length; i++) {
        decodedBytes.push(decoded[i].charCodeAt(0))
    }
    decodedBytesBin=[]
    for (var i=0; i<decodedBytes.length; i++) {
        decodedBytesBin.push(dec2bin(decodedBytes[i]).padStart(8,"0"))
    }

    joinedBinary=decodedBytesBin.join("")

    cut14=joinedBinary.match(/.{1,14}/g)
    // if the last one is less that 14, we must add the previous entry
    if (cut14[cut14.length-1] < 14) {
        Last=parseInt(cut14[cut14.length-1],2)
        beforeLast=parseInt(cut14[cut14.length-2],2)
        cut14[cut14.length-2]=dec2bin(beforeLast+Last)
    }   
    cut14.pop()

    sequence=[]
    // turns out we now encode the shapes directly, no use of the rotation
    shapes=["Tu","Tr","Td","Tl",
            "Jl", "Ju","Jr","Jd",
            "Zh","Zv","On","Sh","Sv",
            "Lr","Ld","Ll","Lu",
            "Iv","Ih"]
    shapeWidth=[3,2,3,2,
            2, 3,2,3,
            3,2,2,3,2,
            2,3,2,3,
            1,3]

    for (var i=0; i<cut14.length;i++) {
        s=cut14[i]
        column=parseInt(s.substring(0,4),2)
        row=parseInt(s.substring(4,9),2)
        shape=shapes[parseInt(s.substring(9,14),2)]
        if (!isNaN(column)&& shape != undefined) {
            ns={event: "pieceMove"
            ,shape:shape
            ,shapeWidth:shapeWidth[shapes.indexOf(shape)]
            ,column:column
            ,row:row}
            sequence.push(ns)
        }
    }
    // unknown why, but the first piece always drop 1 above    
    sequence[0].row+=1

    return ([sequence,startLevel])

}

function changeSpeed(){
    if (this.type != undefined) {
        val=parseInt(document.querySelector("#speedSlider").value)
        game.animation.speedFactor=val
    
    } else {
        val=game.animation.speedFactor
        document.querySelector("#speedSlider").value=val
    }
    document.querySelector("#currentSpeed").innerText=val    
    
}

function toggleSoftDrop() {
   window.game.softDrop = !window.game.softDrop;
}
function togglePauseGameReplay() {
    gameStatus =     document.querySelector("#status");
    if (game.frames.length == game.frame) {
        replay()
        return
    }
    if (gameStatus.style.visibility == "visible") {
        gameStatus.style.visibility = "hidden"
        window.game.paused = false;
    }
    else {
        window.game.paused = true;
        gameStatus.style.visibility = "visible"
    }
}


function drawPiece(canvas,block,b1x,b1y,b2x,b2y,b3x,b3y,b4x,b4y){
    var ctx = canvas.getContext("2d");
    ctx.drawImage(block,b1x*8,b1y*8);
    ctx.drawImage(block,b2x*8,b2y*8);
    ctx.drawImage(block,b3x*8,b3y*8);
    ctx.drawImage(block,b4x*8,b4y*8);
}

function readJson (path) {
    // http://localhost:8080
    return fetch(path)
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }

        return response.json();
    })
    .then(json=>{tetrisGame(json)})
    .catch(function () {
        this.dataError = true;
    })
 }

 function repaintShapes() {
     // in the field, replace each square by the next
     var canvas = document.querySelector('#field')
     var ctx = canvas.getContext("2d");
     var level=window.game.level
     if (level == 0) {
        return // no need to repaint anything, we just started
    }
     var canvasSF = document.querySelector('#squareF')
     var canvasSF2 = document.querySelector('#squareF2')
     var canvasSH = document.querySelector('#squareH')

     for (var i=0;i<canvas.height-5*8; i+=8) {
        var empty=-3;
        for (var j=0;j<canvas.width-3*8; j+=8) {
            var imgd = ctx.getImageData(j+3,i+3,1,1);
            var pix = imgd.data
            if (!(pix.join(",") == "0,0,0,255")) {
                cSF=colors[(level-1)%10][0].join(",")+",255"
                if (pix.join(",") == colors[(level-1)%10][0].join(",")+",255") {
                    ctx.drawImage(canvasSF,j,i);
               }
                else if (pix.join(",") == "255,255,255,255") {
                    ctx.drawImage(canvasSH,j,i);

               } else {
                    ctx.drawImage(canvasSF2,j,i);
               }
            }
        }
        if (empty == 0) {
            linesToClear.push((i/8)+1)
        }
    }

 

 }

function stepEndScreen() {
    var canvasEL = document.querySelector('#endingLine')
    var canvasF = document.querySelector('#field')
    var ctx = canvasF.getContext("2d");
    ctx.drawImage(canvasEL,0,this.endScreenStep*8);
    this.endScreenStep+=1
    if (this.endScreenStep == 20) {
        clearInterval(this.endInt)
    }
}

 function endScreen() {
    this.endScreenStep=0
    this.endInt = setInterval(stepEndScreen,Math.floor(1000/30))
 }

 function buildShapes() {
    // creating the building squares
    var canvasSH = document.querySelector('#squareH')
    var ctx = canvasSH.getContext("2d");

    c=colors[window.game.level%10]
    // type 1 hollow square
    ctx.fillStyle = "rgb("+c[0].join(",")+")"; 
    ctx.fillRect(0,0,7,7);
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,1,1);
    ctx.fillRect(1,1,5,5);

    var canvasSF = document.querySelector('#squareF')
    var ctx = canvasSF.getContext("2d");
    // type 1 filled square
    ctx.fillStyle = "rgb("+c[0].join(",")+")"; 
    ctx.fillRect(0,0,7,7);
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,1,1);
    ctx.fillRect(1,1,1,2);
    ctx.fillRect(1,1,2,1);

    var canvasSF2 = document.querySelector('#squareF2')
    var ctx = canvasSF2.getContext("2d");
    // type 2 filled square
    ctx.fillStyle = "rgb("+c[1].join(",")+")"; 
    ctx.fillRect(0,0,7,7);
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,1,1);
    ctx.fillRect(1,1,1,2);
    ctx.fillRect(1,1,2,1);

    var canvasB = document.querySelector('#squareB')
    var ctx = canvasB.getContext("2d");
    ctx.fillStyle = "black"; // The black square (to erase)
    ctx.fillRect(0,0,7,7);


    // creating each pieces with each rotation
    // need to make this look better, ex : 
    //   #
    //   #
    Tu=[" X ",
        "XXX"];
    drawPiece(document.querySelector('#Td'),canvasSH,1,2,2,2,3,2,2,3)
    drawPiece(document.querySelector('#Tu'),canvasSH,1,2,2,1,3,2,2,2)
    drawPiece(document.querySelector('#Tl'),canvasSH,1,2,2,1,2,2,2,3)
    drawPiece(document.querySelector('#Tr'),canvasSH,2,1,2,2,3,2,2,3)

    drawPiece(document.querySelector('#Iv'),canvasSH,2,0,2,1,2,2,2,3)
    drawPiece(document.querySelector('#Ih'),canvasSH,0,2,1,2,2,2,3,2)

    drawPiece(document.querySelector('#Ld'),canvasSF2,1,2,2,2,3,2,1,3)
    drawPiece(document.querySelector('#Ll'),canvasSF2,1,1,2,1,2,2,2,3)
    drawPiece(document.querySelector('#Lu'),canvasSF2,3,1,1,2,2,2,3,2)
    drawPiece(document.querySelector('#Lr'),canvasSF2,2,1,2,2,2,3,3,3)

    drawPiece(document.querySelector('#Jd'),canvasSF,1,2,2,2,3,2,3,3)
    drawPiece(document.querySelector('#Jl'),canvasSF,2,1,2,2,2,3,1,3)
    drawPiece(document.querySelector('#Ju'),canvasSF,1,1,1,2,2,2,3,2)
    drawPiece(document.querySelector('#Jr'),canvasSF,2,1,2,2,2,3,3,1)

    drawPiece(document.querySelector('#Sh'),canvasSF,1,3,2,2,2,3,3,2)
    drawPiece(document.querySelector('#Sv'),canvasSF,2,1,2,2,3,2,3,3)

    drawPiece(document.querySelector('#Zh'),canvasSF2,1,2,2,2,2,3,3,3)
    drawPiece(document.querySelector('#Zv'),canvasSF2,3,1,2,2,3,2,2,3)

    drawPiece(document.querySelector('#On'),canvasSH,1,2,2,2,2,3,1,3)

    // creating each Black pieces with each rotation

    drawPiece(document.querySelector('#TdB'),canvasB,1,2,2,2,3,2,2,3)
    drawPiece(document.querySelector('#TuB'),canvasB,1,2,2,1,3,2,2,2)
    drawPiece(document.querySelector('#TlB'),canvasB,1,2,2,1,2,2,2,3)
    drawPiece(document.querySelector('#TrB'),canvasB,2,1,2,2,3,2,2,3)

    drawPiece(document.querySelector('#IvB'),canvasB,2,0,2,1,2,2,2,3)
    drawPiece(document.querySelector('#IhB'),canvasB,0,2,1,2,2,2,3,2)

    drawPiece(document.querySelector('#LdB'),canvasB,1,2,2,2,3,2,1,3)
    drawPiece(document.querySelector('#LlB'),canvasB,1,1,2,1,2,2,2,3)
    drawPiece(document.querySelector('#LuB'),canvasB,3,1,1,2,2,2,3,2)
    drawPiece(document.querySelector('#LrB'),canvasB,2,1,2,2,2,3,3,3)

    drawPiece(document.querySelector('#JdB'),canvasB,1,2,2,2,3,2,3,3)
    drawPiece(document.querySelector('#JlB'),canvasB,2,1,2,2,2,3,1,3)
    drawPiece(document.querySelector('#JuB'),canvasB,1,1,1,2,2,2,3,2)
    drawPiece(document.querySelector('#JrB'),canvasB,2,1,2,2,2,3,3,1)

    drawPiece(document.querySelector('#ShB'),canvasB,1,3,2,2,2,3,3,2)
    drawPiece(document.querySelector('#SvB'),canvasB,2,1,2,2,3,2,3,3)

    drawPiece(document.querySelector('#ZhB'),canvasB,1,2,2,2,2,3,3,3)
    drawPiece(document.querySelector('#ZvB'),canvasB,3,1,2,2,3,2,2,3)

    drawPiece(document.querySelector('#OnB'),canvasB,1,2,2,2,2,3,1,3)

    // draw the ending Line
    
    var canvasEL = document.querySelector('#endingLine')
    var ctx = canvasEL.getContext("2d");
    ctx.fillStyle = "rgb("+c[1].join(",")+")"; 
    ctx.fillRect(0,0,100,2);
    ctx.fillStyle = "white";
    ctx.fillRect(0,2,100,4);
    ctx.fillStyle = "rgb("+c[0].join(",")+")"; 
    ctx.fillRect(0,5,100,2);
}

function eraseShape(shape,posX,posY) {
    var canvas = document.querySelector('#field')
    var ctx = canvas.getContext("2d")
    canvaPieceB=document.querySelector('#'+shape+"B")
    ctx.drawImage(canvaPieceB,posX*8,posY*8)
}

function placeShape(shape,posX, posY) {
    var canvas = document.querySelector('#field')
    var ctx = canvas.getContext("2d");
    canvaPiece=document.querySelector('#'+shape)
    ctx.drawImage(canvaPiece,posX*8,posY*8);
}

function clearLines(game,shape,row)
{
    // TODO : check only lines where the shape was placed

    // check center share of each cube, searching for a line
    // with no black pixels
    var canvas = document.querySelector('#field')
    var ctx = canvas.getContext("2d")
    var linesToClear=[]
    for (var i=0;i<canvas.height; i+=8) {
        var empty=-3;
        for (var j=0;j<canvas.width; j+=8) {
            var imgd = ctx.getImageData(j,i,1,1);
            var pix = imgd.data
            if (!(pix[0] == 255 && pix[1] == 255 && pix[2] == 255)) {
                empty+=1
            }
        }
        if (empty == 0) {
            linesToClear.push((i/8)+1)
        }
    }

    return (linesToClear)
}

function updateLevelLinesAndScore(count) {
    window.game.lines+=count;
    if (count == 4) {
        if (!game.soundOff) {
            game.sounds["tetris"].play()
        }
    } else if (count > 0) {
        if (!game.soundOff) {
            game.sounds["clear"].play()
        }
    }
    // this is wrong after level 100:
    if (Math.floor((window.game.lines)/10)>window.game.level) {
        window.game.level+=1;
        buildShapes()
        repaintShapes()
    }
    scoreTable=[0,40,100,300,1200]
    window.game.score+=scoreTable[count]*(window.game.level+1)
    document.querySelector("#linesCount").innerText=window.game.lines;
    document.querySelector("#level").innerText=window.game.level;
    document.querySelector("#score").innerText=window.game.score;
}

function copyTemp() {
    var canvas = document.querySelector('#field')

    var canvasTemp = document.querySelector('#fieldTemp')
    var ctxTemp = canvasTemp.getContext("2d");
    ctxTemp.clearRect(0, 0, canvas.width, canvas.height);
    ctxTemp.drawImage(canvas,0,0);

}

function restoreTemp() {
    var canvas = document.querySelector('#field')
    var ctx = canvas.getContext("2d")

    var canvasTemp = document.querySelector('#fieldTemp')
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvasTemp,0,0);

}

function showNextPiece() {
    if (game.frame < game.frames.length - 1) {
        var canvas = document.querySelector('#nextPiece')
        var ctx = canvas.getContext("2d")
        np=game.frames[game.frame+1].shape
        var delta = 0
        var deltaV = 0
        switch (np[0]) { // Adjusting 
            case "I":
                np = "Ih"
                delta = 4
                deltaV = 4
                break
            case "L":
                np = "Ld"
                break
            case "J":
                np = "Jd"
                break
            case "T":
                np = "Td"
                break
            case "S":
                np = "Sh"
                break
            case "Z":
                np = "Zh"
                break
            case "O":
                delta = 4
                break
        }
        var canvasNP = document.querySelector('#'+np)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasNP,1+delta,-8+deltaV);
    }
}

function draw(game){
    step=game.frames[game.frame]
    game.animation.frame+=1

    FPSCountWindow=100
    if (game.animation.frame%FPSCountWindow == 0) {
        t=new Date().getTime()
        game.prevTime=t
    }
    if (window.game.paused == true) {
        return;
    } else if (game.lineClearInProgress) {
        var canvas = document.querySelector('#field')
        var ctx = canvas.getContext("2d")
    
        if (game.linesToClear.length > 0) {
            // clear animation from the middle, on each line
            ctx.fillStyle = 'black';
            lcs=game.linesClearStep
            for (j = 0; j < game.linesToClear.length; j++) {
                ctx.fillRect(5*8-(lcs*8),(game.linesToClear[j]-1)*8,(lcs*8*2),8)
            }
            game.animation.cleaAnimStep+=1
            if (game.animation.cleaAnimStep == 3) {
                game.linesClearStep+=1
                game.animation.cleaAnimStep=0
            }
            if (game.linesClearStep == 5) {
                // What is suspended shall drop to the ground 
                var canvasTemp = document.querySelector('#fieldTemp')
                var ctxTemp = canvasTemp.getContext("2d");
                for (var i= 0 ; i < game.linesToClear.length ; i++) {
                    sw = canvasTemp.width;
                    sh = game.linesToClear[i]*8;
                    dw = sw;
                    dh = canvasTemp.height - 8;
                    ctxTemp.fillRect(0,0,10*8,20*8);
                    ctxTemp.drawImage(canvas,0, 0, sw, sh, 0, 8, dw, sh);
                    ctx.fillRect(0,0,10*8,sh);
                    ctx.drawImage(ctxTemp.canvas,0,0,10*8,sh,0,0,10*8,sh);
                    copyTemp()
                }
                game.lineClearInProgress = false;
                game.linesClearStep = 0
            } 
        }
        return
    } else if (game.animation.frame == 1) { 
        // draw Field only on first frame
        var canvas = document.querySelector('#field')
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 10*8,20*8);

        var canvasTemp = document.querySelector('#fieldTemp')
        var ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.clearRect(0, 0, canvas.width, canvas.height);
        ctxTemp.fillStyle = 'black';
        ctxTemp.fillRect(0, 0, 10*8,20*8);
    } else {
        if (game.level < 9) {
            game.animation.levelSpeed=48-(5*game.level) // see meatfighter
        } else if (game.level == 9) {
            game.animation.levelSpeed=6
        } else if (game.level < 15) {
            game.animation.levelSpeed=5
        } else if (game.level < 16) {
            game.animation.levelSpeed=4
        } else if (game.level < 19) {
            game.animation.levelSpeed=3
        } else if (game.level < 29) {
            game.animation.levelSpeed=2
        } else {
            game.animation.levelSpeed=1
        }
        if (game.softDrop 
            && game.animation.rotationDone
            && game.animation.alignementDone) {
            game.animation.levelSpeed=1
            // Soft drop = 1/2G 1G : 1 frame per 
        }
        gals=Math.floor(game.animation.levelSpeed/=game.animation.speedFactor)
        if (gals <= 0) {
            gals = 1
        }
        frameStep=game.animation.frame%gals

        if (step != undefined && step.event == "pieceMove" && frameStep == 0) {
            // if (game.animation.frameY == -3) {
            //     console.log("A new piece appears")
            //     // Evaluating if a spin or tuck is need
            //     // we need any of this if the colums above the 
            //     // final piece position are not clear above the piece
                
            // // // highlighting the colum above the target piece
            // //     var tx = (game.lastPiece.column-2)
            // //     var ty = (game.lastPiece.row-3)
            // //     var gls = game.lastPiece.shape 
            // //     var glsw = game.lastPiece.shapeWidth
            // //     var canvas = document.querySelector('#field')
            // //     var ctx = canvas.getContext("2d");
            // //     ctx.fillStyle = 'yellow';
            // //     var deltaPieceX = [1,0,1,1,
            // //                         1,0,0,1,
            // //                         1,2,1,1,2,
            // //                         2,1,1,1,
            // //                         2,-1]
            // //     var deltaPieceY = [1,2,1,1,
            // //                         2,1,2,1,
            // //                         1,1,1,2,0,
            // //                         0,1,0,1,
            // //                         -1,1]
            // //     var dX = deltaPieceX[shapes.indexOf(gls)]
            // //     var dY = deltaPieceY[shapes.indexOf(gls)]
            // //     for (var j=0; j < glsw ; j++) {
            // //         ctx.fillRect((tx+dX+j)*8+2, (ty+dY)*8+2, 3,3);
            // //     }            
            // }


            /*
            Many levels to reach optimal lateral movement:
            1. move the correct column and drop, but it will erase the piece
            2. wait for the path to clear before moving: a tuck
            3. 
            4. pathfinding, let's try A*
            5. spin
            */ 
            // piece animation
            currentX=game.animation.frameX
            currentY=game.animation.frameY
            currentR=game.animation.rotation
            targetX=game.lastPiece.column-2
            targetY=game.lastPiece.row-3
            xDiff=currentX-targetX
            // just before erase we need to backup the cells
            // where the falling piece will be to restore after
        

            eraseShape(game.lastPiece.shape,currentX, currentY-1)
            restoreTemp()

    // just after erase we restore the previous context on the lines
    // involving the falling piece to avoid clearing of existing lines
    // we move the piece to the target X during the first lines
    // we need to move x by xDiff
            xDir=(-1)*(xDiff)/Math.abs(xDiff)
            if (currentX != targetX) {
                game.animation.frameX+=xDir
            } else {
                game.animation.alignementDone = true
            }

            gls=game.lastPiece.shape
            gar=game.animation.rotation
            if (shapesRotation[gls[0]][gar] != gls &&
                game.animation.frameY > 0) { // more visible
                    if (gls[1] == "r") {
                        game.animation.rotation+=2
                        if (!game.soundOff) {
                            game.sounds["turn"].play()
                        }
                    }
                    game.animation.rotation+=1
                    if (!game.soundOff) {
                        game.sounds["turn"].play()
                    }
            } else {
                game.animation.rotationDone = true
            }
            gls=shapesRotation[gls[0]][game.animation.rotation]
            placeShape(gls,currentX, currentY)

            game.animation.frameY+=1
    
            if (targetY == currentY) {
                game.frame+=1
                if (game.frame >= game.frames.length) {
                    saveStats()
                    clearInterval(this.gameInt)
                    endScreen()
                    return;
                }            
                step=game.frames[game.frame]
                if (step.shape[0] != "I") {
                    game.idrought+=1
                } else {
                    game.idrought=0
                    document.querySelector("#idrought").innerText=game.idrought
                }
                if (game.idrought > 7) {
                    document.querySelector("#idrought").innerText=game.idrought
                }
                // placing the animation back to the start:
                game.animation.frameX = 2
                game.animation.frameY = -3
                game.animation.rotation = 0
                game.animation.rotationDone = false
                game.animation.alignementDone = false
        
                // must turn shape to default rotation
                // search for quickest rotation to reach correct one
                // could be a table mapping (-1 / +1 or -2/+2)
                if (!game.soundOff) {
                    game.sounds["land"].play()
                }
                game.linesToClear=clearLines(game,game.lastPiece.shape,game.lastPiece.row)
                c=game.linesToClear.length
                if (c>0) {
                    game.lineClearInProgress = true
                    game.linesClearStep = 0
                }
                updateLevelLinesAndScore(c);
                game.lastPiece={shape:step.shape,shapeWidth:step.shapeWidth,column:step.column
                                ,row:step.row+1};
                showNextPiece()
                copyTemp()
            }
        }
        else if (step.event == "lineCleared") {
//            console.log("we cleared a line");
        }
    }    
}

function reduceFrames(json,game) {
    // need to remove all the intermediary steps in the frames
    game.frames=[]
    game.oframes=[]
    game.frames.push(json[0])
    game.oframes.push(json[0])
    prevFrame=json[0]
    for (var i = 0; i < json.length; i++) {
        game.oframes.push(prevFrame)
        if (json[i].event == "lineCleared") {
            continue;
        }
        if (i > 1 && json[i].row < prevFrame.row) {
//            console.log("here is a new piece")
            game.frames.push(prevFrame)
        }
        prevFrame=json[i]
    }
    // must remove the first frame because
    // it is necessarily wrong
    // an add a row to the next one

    game.frames.shift()

    game.frames[0].row = 19
}

function replay() {
    // clear everything
    clearInterval(this.gameInt)
    var canvas = document.querySelector('#field')
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 10*8,20*8);

    var canvasTemp = document.querySelector('#fieldTemp')
    var ctxTemp = canvasTemp.getContext("2d");
    ctxTemp.clearRect(0, 0, canvas.width, canvas.height);
    ctxTemp.fillStyle = 'black';
    ctxTemp.fillRect(0, 0, 10*8,20*8);

    // reset the 
    tetrisGame(window.game.gameDecoded)
}

function initSounds(game) {
    var sounds={"startGame":null, "shift":null, "turn":null
        , "land":null, "clear":null, "tetris":null, "end":null}

    for (let key in sounds) {
        var audio = new Audio("sounds/"+key+'.wav');
        sounds[key] = audio

    }
    return sounds
}

function addData(db,date,url,owner,score,lines){
    const newItem = {date:date,url:url,owner:owner,score:score,lines:lines}
    const transaction = db.transaction(['NTRgames'], 'readwrite')
    const objectStore = transaction.objectStore('NTRgames')
    const addRequest = objectStore.add(newItem)


    transaction.addEventListener('error', (e) => { 
        console.log("There was a transaction error") 
    })
}

function menuClicked(e) {
    m = e.parentElement
    if (m.classList.contains("deployed")) {
        m.classList.remove("deployed")
        m.querySelector("div").classList.add("hidden")
        m.querySelector("span").innerText = "="
    } else {
        m.classList.add("deployed")
        m.querySelector("div").classList.remove("hidden")
        m.querySelector("span").innerText = "×"
    }
}


function saveStats() {
    let db

    const openRequest =  window.indexedDB.open("NTRdb",1)
    openRequest.addEventListener('error', () => log("DbOpen failed"))
    openRequest.addEventListener('success', () => {
        db=openRequest.result;

        // recover current game Save id        
        const objectStore = db.transaction('NTRgames', 'readwrite')
                            .objectStore('NTRgames');


        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.url === unSlashSplitURL()) {
                const currentGame  = cursor.value;
                currentGame.owner = "trochr";
                currentGame.score = game.score;
                currentGame.lines = game.lines;
                const request = cursor.update(currentGame);
              }
              cursor.continue();
            }
        }
    })
}


function saveGame() {
    let db

    const openRequest =  window.indexedDB.open("NTRdb",1)
    openRequest.addEventListener('error', () => log("DbOpen failed"))
    openRequest.addEventListener('success', () => {
        db= openRequest.result;
        addData(db,Date.now(),unSlashSplitURL(),"trochr")
    })

    openRequest.addEventListener('upgradeneeded', (e) => {
        console.log("Db needs upgradation")
        // get a reference of the db
        db = e.target.result 

        const objectStore = db.createObjectStore('NTRgames', {keyPath: 'id', autoIncrement:true})
        objectStore.createIndex('date', 'date', {unique:false})
        objectStore.createIndex('url', 'url', {unique:true})
        objectStore.createIndex('owner', 'owner', {unique:false})
        console.log("Db setup complete")
    })

    return db
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function formatDate(date) {
    let p = new Intl.DateTimeFormat('en',{
      year:'numeric',
      month:'2-digit',
      day:'2-digit',
      hour:'2-digit',
      minute:'2-digit',
      hour12: false
    }).formatToParts(date).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});
    
    return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`; 
}

function loadGames() {
    let db
    const openRequest =  window.indexedDB.open("NTRdb",1)
    openRequest.addEventListener('error', () => log("DbOpen failed"))

    openRequest.addEventListener('success', () => {
        db = openRequest.result;
        const objectStore = db.transaction('NTRgames').objectStore('NTRgames')
        let oc = objectStore.openCursor()
        oc.addEventListener('success',(e) => {
            const cursor = e.target.result
            let table = document.querySelector("#gamesTable")
            if (cursor) {
                tr=table.insertRow()
                td=tr.insertCell()
                let d=formatDate(cursor.value.date)
                score=cursor.value.score
                lines=cursor.value.lines
                // score=(score == undefined)? -1 : numberWithCommas(score)
                score=(score == undefined)? -1 : score
                lines=(lines == undefined)? -1 : lines
                td.innerHTML=`<a href="${cursor.value.url}">${d}</a>`
                td=tr.insertCell()
                td.innerHTML=cursor.value.owner
                td=tr.insertCell()
                td.innerHTML=lines
                td=tr.insertCell()
                td.innerHTML=score

                cursor.continue()
            } else {
                const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

                const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
                v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
                )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

                // do the work...
                document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
                const table = th.closest('table');
                Array.from(table.querySelectorAll('tr:nth-child(n+2)'))
                .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
                .forEach(tr => table.appendChild(tr) );
                })));
            }
            
        }) 
    })
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }


function exportGames() {
    console.log("Export requested")
    const openRequest =  window.indexedDB.open("NTRdb",1)
    openRequest.addEventListener('error', () => log("DbOpen failed"))

    openRequest.addEventListener('success', () => {
        db = openRequest.result;

        const objectStore = db.transaction('NTRgames').objectStore('NTRgames')
        let output = []
        let oc = objectStore.openCursor()
        oc.addEventListener('success',(e) => {
            const cursor = e.target.result
            if (cursor) {
                output.push(cursor.value)
                cursor.continue()
            } else {
                download(`NTRgames-Export-${new Date().toISOString().slice(0,10)}.txt` , JSON.stringify(output)); 
            }
        })
    })
}

function importData(db,importedData){
    importedData.forEach(element => {
        addData(db,element.date, element.url, element.owner,element.score,element.lines)
    });
}

function readFileAndImport(e) {
    console.log("Import requested")
    const openRequest =  window.indexedDB.open("NTRdb",1)
    openRequest.addEventListener('error', () => console.log("DbOpen failed"))
    openRequest.addEventListener('success', () => {
        db = openRequest.result;

        var reader = new FileReader()
        reader.onload = function() {
            importData(db, JSON.parse(reader.result))
        }
        reader.readAsText(e.files[0])
    })
}

function tetrisGame(gameDecoded){

    // Save game to local DB
    saveGame()
    loadGames()

    //   reduceFrames(json,game)
    game = {paused:false,piecesCount :0,score:0
    ,lines:0,level:0};

    game.frames=gameDecoded[0]
    game.frames.pop() // removing last piece because it glitches
    game.gameDecoded=gameDecoded
    window.game=game
    game.level=parseInt(gameDecoded[1])
    buildShapes()
    repaintShapes()
    game.frame = 0;
    game.soundOff = true;
    game.sounds = initSounds(game)
    game.softDrop = (game.level < 14) ? true : false
    if (!game.softDrop) {
        document.querySelector("#softDrop").checked = false
    }
    t=window.performance.now()
    game.prevTime=t
    game.idrought=0
    game.linesToClear=[]
    game.lastPiece = game.frames[0];

    game.animation = {frame:0,frameX: 2, frameY: -3
                    ,rotation:0,rotationDone:false,speedFactor:1
                    ,alignementDone:false,levelSpeed:48,lineClearInProgress:false,
                    cleaAnimStep:0}
    changeSpeed()
    // game runs at 60.0988 FPS on NTSC NES, need to adjust that later
    if (!game.soundOff) {
        game.sounds["startGame"].play()
    }
    showNextPiece()
    this.gameInt = setInterval(draw,Math.floor(1000/60),game)
}

