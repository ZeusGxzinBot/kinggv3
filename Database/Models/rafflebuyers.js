export default async function (sequelize, DataTypes) {
  let RaffleBuyers = sequelize.define('RaffleBuyers', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    buyed_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
    }

  })
  return RaffleBuyers
}