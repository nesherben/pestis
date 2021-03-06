(function(ns) {
  ns.TiledMap = {
    objectTypes: {
      HIDEOUT: 'hideout',
      STAIRS: 'stairs',
      STAIRS_TOP: 'stairs_top',
      STAIRS_BOTTOM: 'stairs_bottom',
      GROUND: 'ground',
      WALL: 'wall',
      DOOR: 'door',
      SPAWN_POINT: 'spawnpoint',
      PATH: 'path',
      TUNNEL: 'tunnel',
      PATH: 'path',
      KEY: 'key',
      DOOR_TRIGGER: 'door_trigger'
    },

    map: undefined,

    mapName: undefined,

    /**
     * All map objects indexed by their IDs
     */
    objects: {},

    /**
     * Physics groups
     * overspots: non collision objects (stairs starts and ends, objects to pickup, ...)
     * colliders: colliding objects (ground, walls, doors, ...)
     */
    overspots: undefined,
    colliders: undefined,
    pcs: undefined,
    npcs: undefined,


    loadMap: function(map) {
      var levelResources = 'resources/maps/' + map + '/';
      var levelFile = levelResources + map + '.json';
      this.mapName = map;

      this.scene.load.tilemapTiledJSON(map, levelFile);
      this.scene.load.once('complete', function() {
        console.log("Game engine map loaded");
        this.start(map);
      }, this);
      this.scene.load.start();
    },

    buildMap: function(map) {
      console.log("Game engine map built");
      this.map = this.scene.make.tilemap({ key: map });
      this.objects = {};
      this._createObjects();
      this._processLinks();
    },

    _processLinks: function() {
      var keys = _.keys(this.objects);
      for(var i=0, length = keys.length; i < length; ++i) {
        var object = this.objects[keys[i]];
        if(object.type===this.objectTypes.TUNNEL) {
          object.setEnd(this.objects[object._tiledProperties.end]);
        } else if(object.type===this.objectTypes.DOOR) {
          object.setTrigger(this.objects[object._tiledProperties.trigger]);
          object.setKey(this.objects[object._tiledProperties.key]);
        }
      }
    },

    _createObjects: function() {
      if(this.map !== undefined) {
        this.overspots = this.scene.physics.add.group();
        this.colliders = this.scene.physics.add.staticGroup();
        this.pcs = this.scene.add.group();
        this.npcs = this.scene.add.group();

        var objectLayerNames = this.map.getObjectLayerNames();

        for (var i = 0, ilength = objectLayerNames.length; i < ilength; ++i) {
          var objectLayer = this.map.getObjectLayer(objectLayerNames[i]);
          var objects = objectLayer.objects;

          for (var j = 0, olength = objects.length; j < olength; ++j) {
            var object = this._generateObjectProperties(objects[j]);
            var phaserObject;

            switch(object.type) {
              case this.objectTypes.HIDEOUT:
                phaserObject = this.scene.add.hideout(object);
                this.overspots.add(phaserObject);
                break;

              case this.objectTypes.STAIRS_TOP:
              case this.objectTypes.STAIRS_BOTTOM:
                phaserObject = this.scene.add.stairs_spot(object);
                this.overspots.add(phaserObject);
                break;

              case this.objectTypes.STAIRS:
                phaserObject = this.scene.add.stairs(object);
                break;

              case this.objectTypes.GROUND:
              case this.objectTypes.WALL:
                phaserObject = this.scene.add.ground(object);
                this.colliders.add(phaserObject);
                break;

              case this.objectTypes.SPAWN_POINT:;
                if(object._tiledProperties.object_type==='playercharacter') {
                  phaserObject = this.scene.add.character(object)
                  this.pcs.add(phaserObject);
                } else {
                  phaserObject = this.scene.add.enemy(object);
                  phaserObject.path = this.objects[phaserObject._tiledProperties.path];
                  this.npcs.add(phaserObject);
                }
                break;

              case this.objectTypes.PATH:
                phaserObject = this.scene.add.objectpath(object);
                break;

              case this.objectTypes.TUNNEL:
                phaserObject = this.scene.add.tunnel(object);
                this.overspots.add(phaserObject);
                break;

              case this.objectTypes.KEY:
                phaserObject = this.scene.add.doorkey(object);
                this.overspots.add(phaserObject);
                break;

              case this.objectTypes.DOOR:
                phaserObject = this.scene.add.door(object);
                this.colliders.add(phaserObject);
                break;

              case this.objectTypes.DOOR_TRIGGER:
                phaserObject = this.scene.add.door_trigger(object);
                this.overspots.add(phaserObject);
                break;
            }

            if(phaserObject !== undefined) {
              this.objects[phaserObject.id] = phaserObject;
            }
          }
        }
      }
    },

    _generateObjectProperties: function (object){
      object._tiledProperties = {};

      // Load tiled object properties if exist
      var properties = object.properties;
      if(properties !== undefined) {
        for(var i=0, length=properties.length; i<length; ++i) {
          object._tiledProperties[properties[i].name] = properties[i].value;
        }
      }

      return object;
    },

    _destroyObjects: function() {
      this.overspots.destroy(true);
      this.colliders.destroy(true);
      this.pcs.destroy(true);
      this.npcs.destroy(true);
      this.playerCharacter.destroy();
    }
  };
})(candlegamestools.namespace('candlegames.pestis.plugins.components'));
