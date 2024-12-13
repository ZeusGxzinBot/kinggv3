export default async function (sequelize, DataTypes) {
  let Raffle = await sequelize.define('Raffle', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    last_winner: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "870476074876829798"
    },
    last_value: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    ends_in: {
      type: DataTypes.BIGINT,
    }
  })

  return Raffle
}
