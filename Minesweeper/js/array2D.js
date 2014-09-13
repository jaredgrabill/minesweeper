(function () {
    "use strict";

    var Array2D = WinJS.Class.define(
        function (dimX, dimY, defaultValue) {
            this.init(dimX, dimY, defaultValue);
        },
        {
            init: function (dimX, dimY, defaultValue) {
                this._dimX = dimX;
                this._dimY = dimY;
                this._rows = new Array(dimY);

                for (var i = 0; i < dimY; i++) {
                    this._rows[i] = new Array(dimX);

                    for (var j = 0; j < dimX; j++) {
                        this._rows[i][j] = {
                            state: defaultValue.state,
                            uiComponent: defaultValue.uiComponent,
                            setState: defaultValue.setState,
                            x: j,
                            y: i,
                            surroundingMineCount: 0
                        };
                    }
                }
            },

            getItem: function (x, y) {
                return this._rows[y][x];
            },

            elementAt: function (x, y) {
                return this._rows[y][x];
            },

            setItem: function (value, x, y) {
                this._rows[y][x] = value;
            },

            getAdjecentItems: function (x, y) {
                var items = new Array();
                var minx = x == 0 ? 0 : -1;
                var miny = y == 0 ? 0 : -1;
                var maxx = x == (this._dimX - 1) ? 0 : 1;
                var maxy = y == (this._dimY - 1) ? 0 : 1;

                for (var yy = miny; yy <= maxy; yy++) {
                    for (var xx = minx; xx <= maxx; xx++) {
                        if (yy == 0 && xx == 0)
                            continue;
                        var ycord = yy + parseInt(y);
                        var xcord = xx + parseInt(x);
                        items.push(this._rows[ycord][xcord]);
                    }
                }

                return items;
            },

            getWidth: function () {
                return this._dimX;
            },

            getHeight: function () {
                return this._dimY;
            },

            allItems: function () {
                var items = new Array(this._dimX * this._dimY);
                var i = 0;

                for (var y = 0; y < this._dimY; y++) {
                    for (var x = 0; x < this._dimX; x++) {
                        items[i] = this.elementAt(x, y);
                        i++;
                    }
                }

                return items;
            },

            isBoardClear: function () {
                var items = this.allItems();

                for (var i in items) {
                    if (!items[i].isMine && (items[i].state == Minesweeper.SquareState.Covered || items[i].state == Minesweeper.SquareState.Flagged || items[i].state == Minesweeper.SquareState.Unknown))
                        return false;
                }

                return true;
            },

            isBoardNew: function () {
                var items = this.allItems();

                for (var i in items) {
                    if (items[i].state != Minesweeper.SquareState.Covered && items[i].state != Minesweeper.SquareState.Flagged)
                        return false;
                }

                return true;
            }
        });

    WinJS.Namespace.define("Minesweeper", {
        Array2D: Array2D
    });
})();


