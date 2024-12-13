export default async function (sequelize, DataTypes) {
  let Reminders = await sequelize.define('Reminders', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_automatic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_alerted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    time: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  })

  return Reminders
}
