import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as billFieldService from '../services/bill-field.service.js';

// Cache keys for this resource. Invalidation never guesses at a shape.
export const billFieldKeys = {
  all: ['bill-fields'],
};

const byOrder = (a, b) => a.order - b.order;

/** Sections and fields each sorted into form order. */
const sorted = ({ groups, fields }) => ({ groups: [...groups].sort(byOrder), fields: [...fields].sort(byOrder) });

/**
 * The parameter form's definitions: `{ groups, fields }`, archived fields
 * included. They change rarely, so they stay fresh for a few minutes.
 */
export const useBillFields = () =>
  useQuery({
    queryKey: billFieldKeys.all,
    queryFn: billFieldService.listDefinitions,
    select: sorted,
    staleTime: 5 * 60 * 1000,
  });

// Refetch in the background; returning the promise would hold the mutation's spinner.
const useFieldMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billFieldKeys.all });
    },
  });
};

// A move answers with the whole form in its new order, so the cache is written, not refetched.
const useMoveMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }) => mutationFn(id, direction),
    onSuccess: (definitions) => queryClient.setQueryData(billFieldKeys.all, definitions),
  });
};

export const useCreateField = () => useFieldMutation(billFieldService.createField);

export const useUpdateField = () => useFieldMutation(({ id, ...changes }) => billFieldService.updateField(id, changes));

export const useDeleteField = () => useFieldMutation(billFieldService.deleteField);

export const useMoveField = () => useMoveMutation(billFieldService.moveField);

export const useCreateGroup = () => useFieldMutation(billFieldService.createGroup);

export const useUpdateGroup = () => useFieldMutation(({ id, ...changes }) => billFieldService.updateGroup(id, changes));

export const useDeleteGroup = () => useFieldMutation(billFieldService.deleteGroup);

export const useMoveGroup = () => useMoveMutation(billFieldService.moveGroup);
