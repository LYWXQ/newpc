'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'qq', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'QQ号码'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'qq');
  }
};