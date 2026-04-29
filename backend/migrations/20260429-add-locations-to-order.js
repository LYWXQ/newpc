'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'pickupLocation', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '取货地点'
    });
    await queryInterface.addColumn('orders', 'returnLocation', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '还货地点'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'pickupLocation');
    await queryInterface.removeColumn('orders', 'returnLocation');
  }
};