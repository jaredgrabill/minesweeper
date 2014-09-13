(function () {
    "use strict";

    var difficultyLevels = {
        Easy: {
            width: 9,
            height: 9,
            mines: 10
        },
        Medium: {
            width: 16,
            height: 16,
            mines: 40
        },
        Hard: {
            width: 30,
            height: 16,
            mines: 99
        }
    };

    var squareStates = {
        Covered: 0,
        Clear: 1,
        Numbered: 2,
        Flagged: 3,
        Unknown: 4,
        Hit: 5,
        MineShown: 6,
    };

    var gameStates = {
        New: 0,
        Running: 1,
        Won: 2,
        Lost: 3
    };

    var Game = WinJS.Class.define(
        function () {
            Minesweeper.GameInstance = this;
            this.initGame(difficultyLevels.Easy);

            document.getElementById("easyButton").addEventListener(
                "click", function () { Minesweeper.GameInstance.initGame(difficultyLevels.Easy) }, false);
            document.getElementById("mediumButton").addEventListener(
                "click", function () { Minesweeper.GameInstance.initGame(difficultyLevels.Medium) }, false);
            document.getElementById("hardButton").addEventListener(
                "click", function () { Minesweeper.GameInstance.initGame(difficultyLevels.Hard) }, false);
        },
        {
            gameState: gameStates.New,

            startGameClock: function () {
                this._startTime = new Date();
                this._gameClock = setInterval(this.gameTimeTick, 1000);
            },

            showMenu: function () {                
                document.getElementById("menuFlyout").winControl.show(document.getElementById("gameHost"));
            },

            gameTimeTick: function gameTimeTick() {
                var secondsPast = (new Date().getTime() - Minesweeper.GameInstance._startTime.getTime());
                document.getElementById('timeDisplay').innerText = Math.floor(parseInt(secondsPast) / 1000);
            },

            // populate mine field
            setMines: function setMines(firstMoveX, firstMoveY) {
                this.gameState = Minesweeper.GameState.Running;
                this._mines = new Array(this._currentDifficulty.mines);

                for (var i = 0; i < this._currentDifficulty.mines; i++) {
                    var rndx = Math.floor(Math.random() * parseInt(this._gameSquares.getWidth()));
                    var rndy = Math.floor(Math.random() * parseInt(this._gameSquares.getHeight()));

                    while ((rndx == firstMoveX && rndy == firstMoveY) || this._gameSquares.elementAt(rndx, rndy).isMine === true) {
                        //try again
                        rndx = Math.floor(Math.random() * parseInt(this._gameSquares.getWidth()));
                        rndy = Math.floor(Math.random() * parseInt(this._gameSquares.getHeight()));
                    }

                    this._mines[i] = {
                        x: rndx,
                        y: rndy,
                        isActive: true
                    }

                    this._gameSquares.elementAt(rndx, rndy).isMine = true;

                    var adjecentTiles = this._gameSquares.getAdjecentItems(rndx, rndy);
                    for (var j in adjecentTiles) {
                        adjecentTiles[j].surroundingMineCount++;
                    }
                }

                document.getElementById('minesDisplay').innerText = this._currentDifficulty.mines;
            },

            setFlag: function setFlag(x, y) {
                var tile = this._gameSquares.elementAt(x, y);

                if (tile.state === Minesweeper.SquareState.Covered)
                    tile.setState(Minesweeper.SquareState.Flagged);
                else if (tile.state === Minesweeper.SquareState.Flagged)
                    tile.setState(Minesweeper.SquareState.Covered);

                var flagCount = 0;

                var tiles = this._gameSquares.allItems();

                for (var i = 0; i < tiles.length; i++) {
                    if (tiles[i].state === Minesweeper.SquareState.Flagged)
                        flagCount++;
                }

                document.getElementById('minesDisplay').innerText = (parseInt(this._currentDifficulty.mines) - flagCount);

                return;
            },

            processGameMove: function (x, y) {
                var tile = this._gameSquares.elementAt(x, y);

                if (tile.state != Minesweeper.SquareState.Covered) {
                    if (tile.state == Minesweeper.SquareState.Flagged) {
                        tile.setState(Minesweeper.SquareState.Covered);
                    }
                    return;
                }

                if (this._gameSquares.isBoardNew()) {
                    //handle first move
                    this.setMines(x, y);
                    this.startGameClock();
                }

                if (tile.isMine) {
                    //handle game over
                    tile.setState(Minesweeper.SquareState.Hit);
                    this.handleGameOver();
                    return;
                }

                if (tile.surroundingMineCount === 0) {
                    tile.setState(Minesweeper.SquareState.Clear);
                } else {
                    tile.setState(Minesweeper.SquareState.Numbered);
                }

                this.revealEmptyAdjecentTiles(x, y);

                if (this._gameSquares.isBoardClear()) {
                    this.handleGameWin();
                }
            },

            initGame: function initGame(difficultyLevel) {
                if (difficultyLevel === undefined) {
                    if (this._currentDifficulty !== undefined)
                        difficultyLevel = this._currentDifficulty;
                    else
                        difficultyLevel = Minesweeper.Difficulty.Easy;
                }

                this.gameState = Minesweeper.GameState.New;
                this._currentDifficulty = difficultyLevel;
                this._gameTime = 0;

                var gameHost = document.getElementById("gameHost");
                var gameBoard = document.getElementById("game");

                if (gameBoard != null) {
                    var gameSquares = gameBoard.querySelectorAll("div.gameSquare");

                    var c = gameSquares.length;
                    for (var i = 0; i < c; i++) {
                        gameSquares[i].removeEventListener('click', handleClick, false);
                        gameSquares[i].removeEventListener('contextmenu', handleRightClick, false);
                    }

                    //WinJS.Utilities.empty(gameBoard);
                    
                    //gameHost.removeNode(gameBoard);
                }

                gameHost.parentElement.removeChild(gameHost);

                var rows = "";
                var columns = "";
                for (var i = 0; i < difficultyLevel.width; i++)
                    columns += " 1fr";
                for (var i = 0; i < difficultyLevel.height; i++)
                    rows += " 1fr";

                WinJS.Utilities.setInnerHTMLUnsafe(document.getElementById('gameContainer'),
                    '<div id="gameHost" class="primarylayout" data-win-control="WinJS.UI.ViewBox"><div id="game" class="gameboard" style="-ms-grid-rows:' + rows + '; -ms-grid-columns:' + columns + '"; height:' + (parseInt(difficultyLevel.width) * 100) + 'px; width:' + (parseInt(difficultyLevel.height) * 100) + 'px;" ></div></div>');
                                
                gameHost = document.getElementById("gameHost");
                gameBoard = document.getElementById("game");

                this._gameSquares = new Minesweeper.Array2D(difficultyLevel.width, difficultyLevel.height,
                    {
                        state: squareStates.Covered,
                        uiComponent: null,
                        setState: function setState(newState) {
                            this.state = newState;
                            switch (newState) {
                                case Minesweeper.SquareState.Clear:
                                    this.uiComponent.setAttribute('class', "gameSquare empty");
                                    break;
                                case Minesweeper.SquareState.Covered:
                                    this.uiComponent.setAttribute('class', "gameSquare covered");
                                    break;
                                case Minesweeper.SquareState.Flagged:
                                    this.uiComponent.setAttribute('class', "gameSquare flagged");
                                    break;
                                case Minesweeper.SquareState.Hit:
                                    this.uiComponent.setAttribute('class', "gameSquare hit");
                                    break;
                                case Minesweeper.SquareState.MineShown:
                                    this.uiComponent.setAttribute('class', "gameSquare mine");
                                    break;
                                case Minesweeper.SquareState.Numbered:
                                    this.uiComponent.setAttribute('class', "gameSquare numbered");
                                    this.uiComponent.innerText = this.surroundingMineCount;
                                    break;
                                case Minesweeper.SquareState.Unknown:
                                    this.uiComponent.setAttribute('class', "gameSquare unknown");
                                    break;
                            }
                        }
                    });

                for (var x = 0; x < difficultyLevel.width; x++) {
                    for (var y = 0; y < difficultyLevel.height; y++) {
                        var gameSquare = document.createElement('div');
                        gameSquare.setAttribute('class', "gameSquare covered");
                        gameSquare.setAttribute('style', "-ms-grid-row:" + (y + 1) + "; -ms-grid-column: " + (x + 1) + ";");
                        gameSquare.id = "gameSquare_" + x + "_" + y;
                        gameSquare.setAttribute('data-pos-x', x);
                        gameSquare.setAttribute('data-pos-y', y);
                        gameBoard.appendChild(gameSquare);
                        this._gameSquares.elementAt(x, y).uiComponent = gameSquare;
                    }
                }

                gameSquares = gameBoard.querySelectorAll("div.gameSquare");
                var c = gameSquares.length;
                for (var i = 0; i < c; i++) {
                    gameSquares[i].addEventListener('click', handleClick, false);
                    gameSquares[i].addEventListener('contextmenu', handleRightClick, false);
                }

                clearInterval(this._gameClock);

                document.getElementById('minesDisplay').innerText = this._currentDifficulty.mines;
                document.getElementById('timeDisplay').innerText = 0;

                WinJS.UI.processAll();
            },

            handleGameOver: function () {
                clearInterval(this._gameClock);
                this.gameState = Minesweeper.GameState.Lost;
                var tiles = this._gameSquares.allItems();

                for (var i in tiles) {
                    if (tiles[i].state == Minesweeper.SquareState.Hit) {
                        continue;
                    } else if (tiles[i].isMine === true) {
                        tiles[i].setState(Minesweeper.SquareState.MineShown);
                    }
                    else {
                        tiles[i].setState(Minesweeper.SquareState.Clear);
                    }
                }

                var msg = new Windows.UI.Popups.MessageDialog("Sorry, you lost this game. Better luck next time!", "Game Over");
                //Add buttons and set their callback functions
                msg.commands.append(new Windows.UI.Popups.UICommand("Play again",
                    function (command) {
                        Minesweeper.GameInstance.initGame();
                    }));
                msg.showAsync();
            },

            handleGameWin: function () {
                clearInterval(this._gameClock);
                this.gameState = Minesweeper.GameState.Won;
                var tiles = this._gameSquares.allItems();

                for (var i in tiles) {
                    if (tiles[i].state == Minesweeper.SquareState.Hit) {
                        continue;
                    } else if (tiles[i].isMine === true) {
                        tiles[i].setState(Minesweeper.SquareState.MineShown);
                    }
                    else {
                        tiles[i].setState(Minesweeper.SquareState.Clear);
                    }
                }

                var secondsPast =  Math.floor(parseInt((new Date().getTime() - Minesweeper.GameInstance._startTime.getTime()) / 1000));

                var msg = new Windows.UI.Popups.MessageDialog("Great job! You completed this game in " + secondsPast + " seconds.", "You Win!");
                //Add buttons and set their callback functions
                msg.commands.append(new Windows.UI.Popups.UICommand("Play again",
                    function (command) {
                        Minesweeper.GameInstance.initGame();
                    }));
                msg.showAsync();
            },

            revealEmptyAdjecentTiles: function (x, y) {
                if (this._gameSquares.elementAt(x, y).surroundingMineCount === 0) {
                    var adjecentTiles = this._gameSquares.getAdjecentItems(x, y);

                    for (var i = 0; i < adjecentTiles.length; i++) {
                        if (adjecentTiles[i].isMine !== true && adjecentTiles[i].state == Minesweeper.SquareState.Covered) {

                            if (adjecentTiles[i].surroundingMineCount === 0) {
                                adjecentTiles[i].setState(Minesweeper.SquareState.Clear);
                                this.revealEmptyAdjecentTiles(adjecentTiles[i].x, adjecentTiles[i].y);
                            } else {
                                adjecentTiles[i].setState(Minesweeper.SquareState.Numbered);
                            }

                        }
                    }
                }
            }
        });

    WinJS.Namespace.define("Minesweeper", {
        Game: Game,
        Difficulty: difficultyLevels,
        SquareState: squareStates,
        GameState: gameStates
    });

    var handleClick = function handleClick(arg, xpos, ypos) {
        var xpos = this.getAttribute('data-pos-x');
        var ypos = this.getAttribute('data-pos-y');

        var game = Minesweeper.GameInstance;
        game.processGameMove(xpos, ypos);
    }

    var handleRightClick = function handleRightClick(arg, xpos, ypos) {
        var xpos = this.getAttribute('data-pos-x');
        var ypos = this.getAttribute('data-pos-y');

        var game = Minesweeper.GameInstance;
        game.setFlag(xpos, ypos);

        return false;
    }
})();


