/*:
 * @author Coelocanth
 * @plugindesc Remove manual load and save menus.
 * @target MZ
 * 
 * @help This plugin gives more control over the autosave system
 * 
 * Plugin commands:
 * 
 * autosave
 * - This command saves the game to the autosave slot, so that you can autosave
 * from an event.
 * 
 * deleteAutoSave
 * - This command deletes the autosave slot. In combination with "return to title",
 * or "game over", it could be used to implement permadeath mechanics.
 * 
 * updateSaveCommand
 * - Re-configure the plugin parameters related to the save command in the menu
 * 
 * updateAutoSaveTiming
 * - Re-configure the plugin parameters related to the built in autosave hooks
 * 
 * @param autoLoad
 * @text Continue loads latest save
 * @type boolean
 * @default false
 * @desc When using the "continue" command on the title screen, the latest
 * save file is automatically loaded.
 * 
 * @param autoSaveOnly
 * @text Auto Save Only
 * @type boolean
 * @default false
 * @desc When using the "save" command from an event or main menu, the file
 * selection is skipped and the autosave slot is automatically used.
 * 
 * @param autoSaveOnBattleEnd
 * @type boolean
 * @default true
 * @text Auto Save on Battle End
 * @desc Save the game when returning to the map after a battle.
 * 
 * @param autoSaveOnMapChange
 * @type boolean
 * @default true
 * @text Auto Save on Map Change
 * @desc Save the game when transferring to a new map.
 * 
 * @param commonEventOnAutoSave
 * @type common_event
 * @default 0
 * @text Common Event on Auto Save
 * @desc Run a common event after successful autosave
 * 
 * @param commonEventOnAutoSaveError
 * @type common_event
 * @default 0
 * @text Common Event on Auto Save Error
 * @desc Run a common event after failed autosave
 * 
 *
 * @command autoSave
 * @desc Save the game to the auto save slot.
 *
 * 
 * @command deleteAutoSave
 * @desc Delete the auto save slot.
 *  
 * 
 * @command updateSaveCommand
 * @arg autoSaveOnly
 * @text Auto Save Only
 * @type boolean
 * @default false
 * @desc When using the "save" command from an event or main menu, the file
 * selection is skipped and the autosave slot is automatically used.
 * 
 * 
 * @command updateAutoSaveTiming
 * @arg autoSaveOnBattleEnd
 * @type boolean
 * @default true
 * @text Auto Save on Battle End
 * @desc Save the game when returning to the map after a battle.
 * 
 * @arg autoSaveOnMapChange
 * @type boolean
 * @default true
 * @text Auto Save on Map Change
 * @desc Save the game when transferring to a new map.
 */

var Imported = Imported || {};
Imported.CC_AutoSaveControl = true;
var CC = CC || {};
CC.AutoSaveControl = function () {
    const params = PluginManager.parameters("CC_AutoSaveControl");
    return {
        "autoLoad": JSON.parse(params["autoLoad"]),
        "autoSaveOnly": JSON.parse(params["autoSaveOnly"]),
        "autoSaveOnBattleEnd": JSON.parse(params["autoSaveOnBattleEnd"]),
        "autoSaveOnMapChange": JSON.parse(params["autoSaveOnMapChange"]),
        "commonEventOnAutoSave": parseInt(params["commonEventOnAutoSave"]),
        "commonEventOnAutoSaveError": parseInt(params["commonEventOnAutoSaveError"])
    }
}();
CC.AutoSaveControl.cmdAutoSave = function (args) {
    SceneManager._scene.requestAutosave();
}
CC.AutoSaveControl.cmdDeleteAutoSave = function (args) {
    DataManager.removeSaveFile(0);
}
CC.AutoSaveControl.cmdUpdateSaveCommand = function(args) {
    CC.AutoSaveControl.autoSaveOnly = JSON.parse(args.autoSaveOnly);
}
CC.AutoSaveControl.cmdUpdateAutoSaveTiming = function(arg) {
    CC.AutoSaveControl.autoSaveOnBattleEnd = JSON.parse(args.autoSaveOnBattleEnd);
    CC.AutoSaveControl.autoSaveOnMapChange = JSON.parse(args.autoSaveOnMapChange);
}
PluginManager.registerCommand("CC_AutoSaveControl", "autoSave", CC.AutoSaveControl.cmdAutoSave);
PluginManager.registerCommand("CC_AutoSaveControl", "deleteAutoSave", CC.AutoSaveControl.cmdDeleteAutoSave);
PluginManager.registerCommand("CC_AutoSaveControl", "updateSaveCommand", CC.AutoSaveControl.cmdUpdateSaveCommand);
PluginManager.registerCommand("CC_AutoSaveControl", "updateAutoSaveTiming", CC.AutoSaveControl.cmdUpdateAutoSaveTiming);

if (CC.AutoSaveControl.autoLoad) {
    Scene_Load.prototype.create = function () {
        Scene_File.prototype.create.call(this);
        this._listWindow.hide();
        this._helpWindow.hide();
        this._backgroundSprite.filters = [];
    };

    Scene_Load.prototype.start = function () {
        Scene_File.prototype.start.call(this);
        this.executeLoad(this.firstSavefileId());
    };

    Scene_Load.prototype.onLoadFailure = function () {
        SoundManager.playBuzzer();
        this.popScene();
    };
}

CC.AutoSaveControl.Scene_Base_onAutosaveSuccess = Scene_Base.prototype.onAutosaveSuccess;
Scene_Base.prototype.onAutosaveSuccess = function() {
    CC.AutoSaveControl.Scene_Base_onAutosaveSuccess.call(this);
    if(CC.AutoSaveControl.commonEventOnAutoSave > 0) {
        $gameTemp.reserveCommonEvent(CC.AutoSaveControl.commonEventOnAutoSave);
    }
}

CC.AutoSaveControl.Scene_Base_onAutosaveFailure = Scene_Base.prototype.onAutosaveFailure;
Scene_Base.prototype.onAutosaveFailure = function() {
    CC.AutoSaveControl.Scene_Base_onAutosaveFailure.call(this);
    if(CC.AutoSaveControl.commonEventOnAutoSaveError > 0) {
        $gameTemp.reserveCommonEvent(CC.AutoSaveControl.commonEventOnAutoSaveError);
    }
}

CC.AutoSaveControl.Scene_Menu_commandSave = Scene_Menu.prototype.commandSave;
Scene_Menu.prototype.commandSave = function () {
    if (CC.AutoSaveControl.autoSaveOnly) {
        SoundManager.playSave();
        this.requestAutosave();
    } else {
        CC.AutoSaveControl.Scene_Menu_commandSave.call(this);
    }
};

CC.AutoSaveControl.Scene_Map_shouldAutosave = Scene_Map.prototype.shouldAutosave;
Scene_Map.prototype.shouldAutosave = function () {
    return CC.AutoSaveControl.autoSaveOnMapChange && CC.AutoSaveControl.Scene_Map_shouldAutosave.call(this);
};

CC.AutoSaveControl.Scene_Battle_shouldAutosave = Scene_Battle.prototype.shouldAutosave;
Scene_Battle.prototype.shouldAutosave = function () {
    return CC.AutoSaveControl.autoSaveOnBattleEnd && CC.AutoSaveControl.Scene_Battle_shouldAutosave.call(this);
};

//New function, surprisingly
DataManager.removeSaveFile = function(savefileId) {
    const saveName = this.makeSavename(savefileId);
    StorageManager.remove(saveName); //sync call
    const globalInfo = this._globalInfo;
    delete globalInfo[savefileId];
    this.saveGlobalInfo();
}
