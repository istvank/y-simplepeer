/* global Y */
'use strict'

var SimplePeer = require('simple-peer')
var uuid = require('uuid');

function extend (Y) {
  class SimplePeerConnector extends Y.AbstractConnector {
    constructor(y, options) {
      if (options === undefined) {
        throw new Error('Options must be defined.');
      }
      if (options.simplepeer == null) {
        throw new Error('SimplePeer object must be defined.')
      }
      super(y, options);
      this.simplepeer = options.simplepeer;
      var self = this;

      self.simplepeer.on('connect', function () {
        console.log('SIMPLEPEER CONNECTED');

        self.setUserId(uuid.v4());
      });

      self.simplepeer.on('data', function (data) {
        if (data.action === 'data') {
          self.receiveMessage(data.peerID, data.payload);
        } else if (data.action === 'join') {
          self.userJoined(data.peerID, 'master')
        }
        //TODO: peer left, probably on some kind of simple-peer disconnect event
      });

    }

    disconnect() {
      this.simplepeer.destroy();
      super.disconnect();
    }

    reconnect() {
      throw new Error('Reconnect is not implemented.');
      super.reconnect();
    }

    send(uid, message) {
      var self = this;
      // we have to make sure that the message is sent under all circumstances
      var send = function () {
        // check if the clients still exists
        //var peer = self.swr.webrtc.getPeers(uid)[0];
        var success;
        //if (peer) {
        // success is true, if the message is successfully sent
        var data = {};
        data.action = 'data';
        data.peerID = self.userId;
        data.payload = message;
        success = self.simplepeer.send(JSON.stringify(data));
        //}
        if (!success) {
          // resend the message if it didn't work
          setTimeout(send, 500);
        }
      }
      // try to send the message
      send();
    }

    broadcast (message) {
      var data = {};
      data.action = 'data';
      data.peerID = self.userId;
      data.payload = message;
      self.simplepeer.send(JSON.stringify(data));
      //throw new Error('Broadcast is not implemented.');
    }

    isDisconnected () {
      return false;
    }
  }
  Y.extend('simplepeer', SimplePeerConnector);
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}
