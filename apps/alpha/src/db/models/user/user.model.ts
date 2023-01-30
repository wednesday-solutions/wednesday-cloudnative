import type { ModelDefined, Optional } from '../../index';
import { DataTypes, dbConnection } from '../../index';
import type { UserAttributes } from './user.schema';

type UserCreationAttributes = Optional<UserAttributes, 'id'>;

/**
 * User Entity in the database represents a user which belongs to a tenant
 */
export const User: ModelDefined<UserCreationAttributes, UserAttributes>
  = dbConnection.instance.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      publicUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'public_uuid',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      belongsToTenant: {
        type: DataTypes.NUMBER,
        allowNull: false,
        field: 'belongs_to_tenant',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    { schema: 'main', tableName: 'users', timestamps: false },
  );

export default User;

