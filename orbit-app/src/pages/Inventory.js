import React from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import PageTitle from '../components/common/PageTitle';
import DangerButton from './../components/common/DangerButton';
import FormError from './../components/FormError';
import FormSuccess from './../components/FormSuccess';
import InventoryItemForm from './../components/InventoryItemForm';
import { formatCurrency } from './../util';

const InventoryItemContainer = ({ children }) => (
  <div className="bg-white rounded shadow-md mb-4 p-4">
    {children}
  </div>
);

const InventoryItem = ({ item, onDelete }) => {
  return (
    <div className="flex">
      <img
        className="rounded w-32 h-full"
        src={item.image}
        alt="inventory"
      />
      <div className="flex justify-between w-full">
        <div className="flex flex-col ml-4 justify-between">
          <div>
            <p className="font-bold text-xl text-gray-900">
              {item.name}
            </p>
            <p className="text-sm text-gray-600">
              {item.itemNumber}
            </p>
          </div>
          <div>
            <p className="text-gray-700 text-xl">
              {formatCurrency(item.unitPrice)}
            </p>
          </div>
        </div>
        <div className="self-end">
          <DangerButton
            text="Delete"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to delete this item?'
                )
              ) {
                onDelete({ variables: { id: item._id } });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const NewInventoryItem = ({ onSubmit }) => {
  return (
    <section className="bg-white p-4 shadow-md rounded-md">
      <p className="font-bold mb-2">New Inventory Item</p>
      <InventoryItemForm onSubmit={onSubmit} />
    </section>
  );
};

const INVENTORY_ITEMS = gql`
  {
    inventoryItems {
      _id
      name
      itemNumber
      unitPrice
      image
    }
  }
`;

const ADD_INVENTORY_ITEM = gql`
  mutation AddInventoryItem(
    $name: String!
    $itemNumber: String!
    $unitPrice: Float!
  ) {
    addInventoryItem(
      name: $name
      itemNumber: $itemNumber
      unitPrice: $unitPrice
    ) {
      message
      inventoryItem {
        _id
        name
        itemNumber
        unitPrice
        image
      }
    }
  }
`;

const DELETE_INVENTORY_ITEM = gql`
  mutation DeleteInventoryItem($id: ID!) {
    deleteInventoryItem(id: $id) {
      message
      inventoryItem {
        _id
        name
        itemNumber
        unitPrice
        image
      }
    }
  }
`;

const Inventory = () => {
  const {
    loading: queryLoading,
    error: queryError,
    data
  } = useQuery(INVENTORY_ITEMS);

  const [
    addInventoryItem,
    { data: addItemData }
  ] = useMutation(ADD_INVENTORY_ITEM, {
    update(cache, { data: { addInventoryItem } }) {
      const { inventoryItem } = addInventoryItem;
      const { inventoryItems } = cache.readQuery({
        query: INVENTORY_ITEMS
      });
      cache.writeQuery({
        query: INVENTORY_ITEMS,
        data: {
          inventoryItems: [...inventoryItems, inventoryItem]
        }
      });
    }
  });

  const [deleteInventoryItem] = useMutation(
    DELETE_INVENTORY_ITEM,
    {
      update(cache, { data: { deleteInventoryItem } }) {
        const { inventoryItem } = deleteInventoryItem;
        const { inventoryItems } = cache.readQuery({
          query: INVENTORY_ITEMS
        });
        cache.writeQuery({
          query: INVENTORY_ITEMS,
          data: {
            inventoryItems: inventoryItems.filter(
              item => item._id !== inventoryItem._id
            )
          }
        });
      }
    }
  );

  return (
    <>
      {queryLoading && <p>Loading...</p>}
      {queryError && <p>{JSON.stringify(queryError)}</p>}
      <PageTitle title="Inventory" />
      {addItemData && (
        <FormSuccess
          text={addItemData.addInventoryItem.message}
        />
      )}
      {queryError && <FormError text={queryError} />}
      <div className="mb-4">
        <NewInventoryItem onSubmit={addInventoryItem} />
      </div>
      {data && data.inventoryItems.length
        ? data.inventoryItems.map(item => (
            <InventoryItemContainer key={item._id}>
              <InventoryItem
                item={item}
                onDelete={deleteInventoryItem}
              />
            </InventoryItemContainer>
          ))
        : 'No Inventory Items'}
    </>
  );
};

export default Inventory;
