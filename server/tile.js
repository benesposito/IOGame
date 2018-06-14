class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.owner = 'neutral';
        this.color = '#FFFFFF';
    }

    setOwner(player) {
        if(player === 'neutral') {
            this.owner = player;
            this.color = '#FFFFFF';
            return;
        }

        this.owner = player.id;
        this.color = player.color;
    }

    getData() {
        return {
            x: this.x,
            y: this.y,
            owner: this.owner,
            color: this.color
        }
    }
}

module.exports = Tile;
